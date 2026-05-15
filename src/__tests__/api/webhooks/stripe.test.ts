import type { SupabaseClient } from '@supabase/supabase-js';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockConstructEvent = jest.fn();
jest.mock('@/src/lib/stripe', () => ({
  getStripe: jest.fn(() => ({ webhooks: { constructEvent: mockConstructEvent } })),
}));

jest.mock('@/src/lib/supabase', () => ({ getSupabase: jest.fn() }));

jest.mock('@/src/lib/logger', () => ({
  log: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { getSupabase } from '@/src/lib/supabase';
import { POST } from '@/app/api/webhooks/stripe/route';

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;

const TEST_BRIEF_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const TEST_SESSION_ID = 'cs_test_abc123';

const BRIEF_ROW_UNPAID = { payment_status: 'pending' };
const BRIEF_ROW_PAID   = { payment_status: 'paid' };

type ChainMock = {
  from: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  single: jest.Mock;
  eqAfterSelect: jest.Mock;
  eqAfterUpdate: jest.Mock;
};

function makeSupabaseMock({
  briefRow = BRIEF_ROW_UNPAID,
  insertError = null as null | { code?: string; message?: string },
  selectError = null as null | { message: string },
}: {
  briefRow?: Record<string, unknown>;
  insertError?: null | { code?: string; message?: string };
  selectError?: null | { message: string };
} = {}): ChainMock {
  const single = jest.fn().mockResolvedValue(
    selectError ? { data: null, error: selectError } : { data: briefRow, error: null }
  );
  const eqAfterSelect = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq: eqAfterSelect }));

  const insert = jest.fn().mockResolvedValue({ error: insertError });

  const eqAfterUpdate = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn(() => ({ eq: eqAfterUpdate }));

  const from = jest.fn((table: string) => {
    if (table === 'briefs') return { select, update };
    if (table === 'brief_jobs') return { insert };
    return { select, update, insert };
  });

  return { from, select, insert, update, single, eqAfterSelect, eqAfterUpdate };
}

function makeRequest(body: string, sig?: string): Request {
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body,
    headers: sig ? { 'stripe-signature': sig } : {},
  });
}

function makeCheckoutEvent(briefId: string | null = TEST_BRIEF_ID) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: TEST_SESSION_ID,
        metadata: briefId ? { brief_id: briefId } : {},
      },
    },
  };
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  // ── Signature validation ──────────────────────────────────────────────────

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/stripe-signature/i);
  });

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature'); });
    const res = await POST(makeRequest('{}', 'bad-sig'));
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/invalid signature/i);
  });

  it('passes raw body string to constructEvent — never parsed JSON', async () => {
    const rawBody = '{"type":"payment_intent.created"}';
    mockConstructEvent.mockReturnValue({ type: 'payment_intent.created', data: { object: {} } });
    await POST(makeRequest(rawBody, 'valid-sig'));
    expect(mockConstructEvent).toHaveBeenCalledWith(rawBody, 'valid-sig', 'whsec_test');
  });

  // ── Non-checkout events ───────────────────────────────────────────────────

  it('returns 200 and does nothing for non-checkout events', async () => {
    mockConstructEvent.mockReturnValue({ type: 'payment_intent.created', data: { object: {} } });
    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
  });

  // ── checkout.session.completed ────────────────────────────────────────────

  it('returns 400 when brief_id is missing from metadata', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent(null));
    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when brief is not found in Supabase', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({ selectError: { message: 'not found' } });
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);
    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(404);
  });

  it('skips when brief is already paid (idempotency guard)', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({ briefRow: BRIEF_ROW_PAID });
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);
    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
    expect(mock.insert).not.toHaveBeenCalled();
  });

  it('queues job and returns 200 immediately on valid payment', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({});
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);

    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
    // Job inserted into brief_jobs
    expect(mock.insert).toHaveBeenCalledWith({ brief_id: TEST_BRIEF_ID });
    // Brief status updated to queued
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'queued' }));
  });

  it('returns 200 when job already queued (unique constraint — Stripe retry)', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({ insertError: { code: '23505', message: 'duplicate' } });
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);

    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
  });

  it('looks up brief by the correct brief_id from metadata', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({});
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);

    await POST(makeRequest('{}', 'valid-sig'));
    expect(mock.eqAfterSelect).toHaveBeenCalledWith('id', TEST_BRIEF_ID);
  });
});
