import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'user_test123' }),
}));

jest.mock('@vercel/functions', () => ({
  waitUntil: jest.fn(),
}));

jest.mock('@/src/lib/supabase', () => ({ getSupabase: jest.fn() }));
jest.mock('@/src/lib/users', () => ({
  getOrCreateUser: jest.fn().mockResolvedValue({ id: 'internal-uuid-test', clerk_user_id: 'user_test123', email: 'test@example.com', invite_code: null, invite_revoked_at: null, briefs_generated: 0 }),
  incrementUserBriefCount: jest.fn().mockResolvedValue(undefined),
}));
import { getSupabase } from '@/src/lib/supabase';
import { GET } from '@/app/api/brief/poll/route';

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;
const TEST_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeSelectChain(result: { data: unknown; error: unknown }) {
  const single = jest.fn().mockResolvedValue(result);
  const eqNode = { single } as Record<string, unknown>;
  const eq = jest.fn(() => eqNode);
  eqNode.eq = eq;
  const select = jest.fn(() => ({ eq }));
  return { select, eq, single, from: jest.fn(() => ({ select })) };
}

function makeRequest(briefId?: string): Request {
  const url = briefId
    ? `http://localhost/api/brief/poll?brief_id=${briefId}`
    : 'http://localhost/api/brief/poll';
  return new Request(url);
}

describe('GET /api/brief/poll', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when brief_id is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/brief_id/);
  });

  it('returns 404 when brief not found', async () => {
    const chain = makeSelectChain({ data: null, error: { message: 'not found' } });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    const res = await GET(makeRequest(TEST_ID));
    expect(res.status).toBe(404);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('not_found');
  });

  it('returns status=pending for an unpaid brief', async () => {
    const chain = makeSelectChain({ data: { id: TEST_ID, payment_status: 'pending' }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    const res = await GET(makeRequest(TEST_ID));
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; briefId: string };
    expect(body.status).toBe('pending');
    expect(body.briefId).toBe(TEST_ID);
  });

  it('returns status=paid for a completed brief', async () => {
    const chain = makeSelectChain({ data: { id: TEST_ID, payment_status: 'paid' }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    const res = await GET(makeRequest(TEST_ID));
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('paid');
  });

  it('returns status=error for a failed brief', async () => {
    const chain = makeSelectChain({ data: { id: TEST_ID, payment_status: 'error' }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    const res = await GET(makeRequest(TEST_ID));
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('error');
  });

  it('returns status=awaiting_payment and does not fire pipeline', async () => {
    const { waitUntil } = jest.requireMock('@vercel/functions') as { waitUntil: jest.Mock };
    const chain = makeSelectChain({ data: { id: TEST_ID, payment_status: 'awaiting_payment' }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    const res = await GET(makeRequest(TEST_ID));
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe('awaiting_payment');
    expect(waitUntil).not.toHaveBeenCalled();
  });

  it('queries by the provided brief_id', async () => {
    const chain = makeSelectChain({ data: { id: TEST_ID, payment_status: 'paid' }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    await GET(makeRequest(TEST_ID));
    expect(chain.eq).toHaveBeenCalledWith('id', TEST_ID);
  });
});
