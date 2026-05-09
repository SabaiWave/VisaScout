import type { SupabaseClient } from '@supabase/supabase-js';
import type { VisaBrief, VisaRequest, ConflictReport, AgentResultEnvelope } from '@/src/types/index';
import visaRequestFixture from '@/src/__fixtures__/agents/visaRequest.json';
import visaBriefFixture from '@/src/__fixtures__/visaBrief.json';
import officialPolicyFixture from '@/src/__fixtures__/agents/officialPolicy.json';
import recentChangesFixture from '@/src/__fixtures__/agents/recentChanges.json';
import communityIntelFixture from '@/src/__fixtures__/agents/communityIntel.json';
import entryRequirementsFixture from '@/src/__fixtures__/agents/entryRequirements.json';
import borderRunFixture from '@/src/__fixtures__/agents/borderRun.json';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockConstructEvent = jest.fn();
jest.mock('@/src/lib/stripe', () => ({
  getStripe: jest.fn(() => ({ webhooks: { constructEvent: mockConstructEvent } })),
  PRICES: { standard: { amount: 299, label: 'Standard Brief' }, deep: { amount: 599, label: 'Deep Brief' } },
}));

jest.mock('@/src/lib/supabase', () => ({ getSupabase: jest.fn() }));

jest.mock('@/src/lib/saveBrief', () => ({
  updateBriefWithContent: jest.fn().mockResolvedValue(undefined),
  createShellBrief: jest.fn(),
  saveBrief: jest.fn(),
}));

jest.mock('@/src/lib/dryRun', () => ({ runDryPipeline: jest.fn() }));

jest.mock('@/src/orchestrator', () => ({ runOrchestrator: jest.fn() }));
jest.mock('@/src/synthesis/conflictResolver', () => ({ resolveConflicts: jest.fn() }));
jest.mock('@/src/synthesis/synthesize', () => ({ synthesizeBrief: jest.fn() }));

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@/src/lib/logger', () => ({
  log: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { getSupabase } from '@/src/lib/supabase';
import { updateBriefWithContent } from '@/src/lib/saveBrief';
import { runDryPipeline } from '@/src/lib/dryRun';
import { runOrchestrator } from '@/src/orchestrator';
import { resolveConflicts } from '@/src/synthesis/conflictResolver';
import { synthesizeBrief } from '@/src/synthesis/synthesize';
import { POST } from '@/app/api/webhooks/stripe/route';

const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;
const mockUpdateBrief = updateBriefWithContent as jest.MockedFunction<typeof updateBriefWithContent>;
const mockDryPipeline = runDryPipeline as jest.MockedFunction<typeof runDryPipeline>;
const mockRunOrchestrator = runOrchestrator as jest.MockedFunction<typeof runOrchestrator>;
const mockResolveConflicts = resolveConflicts as jest.MockedFunction<typeof resolveConflicts>;
const mockSynthesizeBrief = synthesizeBrief as jest.MockedFunction<typeof synthesizeBrief>;

const VISA_REQUEST = visaRequestFixture as VisaRequest;
const VISA_BRIEF = visaBriefFixture as unknown as VisaBrief;
const TEST_BRIEF_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const TEST_SESSION_ID = 'cs_test_abc123';

const BRIEF_ROW = {
  nationality: 'American',
  destination: 'Thailand',
  visa_type: null,
  freeform_input: 'Arriving March 15',
  depth: 'standard',
};

const MOCK_ENVELOPE: AgentResultEnvelope = {
  visaRequest: VISA_REQUEST,
  officialPolicy: { status: 'success', data: officialPolicyFixture.data as AgentResultEnvelope['officialPolicy']['data'], confidence: 'high', gaps: [], sourceTier: 1, sourceUrls: [], verified: true, durationMs: 100 },
  recentChanges: { status: 'success', data: recentChangesFixture.data as AgentResultEnvelope['recentChanges']['data'], confidence: 'high', gaps: [], sourceTier: 1, sourceUrls: [], verified: true, durationMs: 100 },
  communityIntel: { status: 'success', data: communityIntelFixture.data as AgentResultEnvelope['communityIntel']['data'], confidence: 'medium', gaps: [], sourceTier: 4, sourceUrls: [], verified: true, durationMs: 100 },
  entryRequirements: { status: 'success', data: entryRequirementsFixture.data as AgentResultEnvelope['entryRequirements']['data'], confidence: 'high', gaps: [], sourceTier: 1, sourceUrls: [], verified: true, durationMs: 100 },
  borderRun: { status: 'success', data: borderRunFixture.data as AgentResultEnvelope['borderRun']['data'], confidence: 'medium', gaps: [], sourceTier: 2, sourceUrls: [], verified: true, durationMs: 100 },
};

function makeSupabaseMock(ops: {
  select?: { data: unknown; error: unknown };
  update?: { error: unknown };
}) {
  const single = jest.fn().mockResolvedValue(ops.select ?? { data: BRIEF_ROW, error: null });
  const eqSelect = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq: eqSelect }));

  const eqUpdate = jest.fn().mockResolvedValue(ops.update ?? { error: null });
  const update = jest.fn(() => ({ eq: eqUpdate }));

  const from = jest.fn(() => ({ select, update }));
  return { from, select, eqSelect, single, update, eqUpdate };
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
    process.env.ANTHROPIC_API_KEY = 'test-key';

    // Restore default implementations so both DRY_RUN paths work
    mockDryPipeline.mockResolvedValue({ brief: VISA_BRIEF, visaRequest: VISA_REQUEST });
    mockRunOrchestrator.mockResolvedValue(MOCK_ENVELOPE);
    mockResolveConflicts.mockResolvedValue(VISA_BRIEF.conflictReport as ConflictReport);
    mockSynthesizeBrief.mockResolvedValue(VISA_BRIEF);
    mockUpdateBrief.mockResolvedValue(undefined);
  });

  // ── Signature validation ──────────────────────────────────────────────────

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toMatch(/stripe-signature/i);
  });

  it('returns 400 when signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error('Invalid signature'); });

    const res = await POST(makeRequest('{}', 'bad-sig'));
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toMatch(/invalid signature/i);
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
    expect(mockUpdateBrief).not.toHaveBeenCalled();
  });

  // ── checkout.session.completed ────────────────────────────────────────────

  it('returns 400 when brief_id is missing from metadata', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent(null));

    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when brief is not found in Supabase', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({ select: { data: null, error: { message: 'not found' } } });
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);

    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(404);
  });

  it('runs pipeline and sets payment_status=paid on success', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({});
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);

    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
    expect(mockUpdateBrief).toHaveBeenCalledWith(expect.objectContaining({
      briefId: TEST_BRIEF_ID,
      stripeSessionId: TEST_SESSION_ID,
      paymentStatus: 'paid',
    }));
  });

  it('sets payment_status=error via direct DB update when pipeline throws', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({});
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);
    mockDryPipeline.mockRejectedValue(new Error('pipeline exploded'));
    mockRunOrchestrator.mockRejectedValue(new Error('pipeline exploded'));

    const res = await POST(makeRequest('{}', 'valid-sig'));
    expect(res.status).toBe(200);
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: 'error',
      stripe_session_id: TEST_SESSION_ID,
    }));
  });

  it('looks up brief by the correct brief_id from metadata', async () => {
    mockConstructEvent.mockReturnValue(makeCheckoutEvent());
    const mock = makeSupabaseMock({});
    mockGetSupabase.mockReturnValue({ from: mock.from } as unknown as SupabaseClient);

    await POST(makeRequest('{}', 'valid-sig'));
    expect(mock.eqSelect).toHaveBeenCalledWith('id', TEST_BRIEF_ID);
  });
});
