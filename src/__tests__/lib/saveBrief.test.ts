import type { SupabaseClient } from '@supabase/supabase-js';
import { saveBrief, createShellBrief, updateBriefWithContent } from '../../lib/saveBrief';
import type { VisaBrief, VisaRequest } from '../../types/index';
import visaRequestFixture from '../../__fixtures__/agents/visaRequest.json';
import visaBriefFixture from '../../__fixtures__/visaBrief.json';

jest.mock('../../lib/supabase', () => ({ getSupabase: jest.fn() }));
import { getSupabase } from '../../lib/supabase';
const mockGetSupabase = getSupabase as jest.MockedFunction<typeof getSupabase>;

const VISA_REQUEST = visaRequestFixture as VisaRequest;
const VISA_BRIEF = visaBriefFixture as unknown as VisaBrief;
const TEST_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeInsertChain(result: { data: unknown; error: unknown }) {
  const single = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  return { insert, select, single, from: jest.fn(() => ({ insert })) };
}

function makeUpdateChain(result: { error: unknown }) {
  const eq = jest.fn().mockResolvedValue(result);
  const update = jest.fn(() => ({ eq }));
  return { update, eq, from: jest.fn(() => ({ update })) };
}

function makeSelectChain(result: { data: unknown; error: unknown }) {
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn(() => ({ single }));
  const select = jest.fn(() => ({ eq }));
  return { select, eq, single, from: jest.fn(() => ({ select })) };
}

describe('saveBrief', () => {
  it('inserts brief and returns the id', async () => {
    const chain = makeInsertChain({ data: { id: TEST_ID }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    const id = await saveBrief({ visaRequest: VISA_REQUEST, brief: VISA_BRIEF, depth: 'standard', userId: 'user-1' });

    expect(id).toBe(TEST_ID);
    expect(chain.from).toHaveBeenCalledWith('briefs');
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      nationality: VISA_REQUEST.normalizedNationality,
      destination: VISA_REQUEST.normalizedDestination,
      depth: 'standard',
    }));
  });

  it('throws when Supabase returns an error', async () => {
    const chain = makeInsertChain({ data: null, error: { message: 'insert failed' } });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    await expect(saveBrief({ visaRequest: VISA_REQUEST, brief: VISA_BRIEF, depth: 'quick' }))
      .rejects.toThrow('insert failed');
  });
});

describe('createShellBrief', () => {
  it('inserts shell record with payment_status=pending and returns id', async () => {
    const chain = makeInsertChain({ data: { id: TEST_ID }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    const id = await createShellBrief({
      nationality: 'American',
      destination: 'Thailand',
      visaType: 'Visa Exemption',
      freeform: 'Arriving March 15',
      depth: 'standard',
      userId: 'user-1',
    });

    expect(id).toBe(TEST_ID);
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
      nationality: 'American',
      destination: 'Thailand',
      payment_status: 'pending',
      degraded: false,
    }));
  });

  it('omits visa_type when not provided', async () => {
    const chain = makeInsertChain({ data: { id: TEST_ID }, error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    await createShellBrief({
      nationality: 'British',
      destination: 'Vietnam',
      freeform: 'Staying 90 days',
      depth: 'deep',
      userId: 'user-2',
    });

    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ visa_type: null }));
  });

  it('throws when Supabase returns an error', async () => {
    const chain = makeInsertChain({ data: null, error: { message: 'connection refused' } });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    await expect(createShellBrief({
      nationality: 'Australian',
      destination: 'Indonesia',
      freeform: 'test',
      depth: 'standard',
      userId: 'user-3',
    })).rejects.toThrow('connection refused');
  });
});

describe('updateBriefWithContent', () => {
  it('updates all content fields and sets payment_status', async () => {
    const chain = makeUpdateChain({ error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    await updateBriefWithContent({
      briefId: TEST_ID,
      visaRequest: VISA_REQUEST,
      brief: VISA_BRIEF,
      stripeSessionId: 'cs_test_abc',
      paymentStatus: 'paid',
    });

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      stripe_session_id: 'cs_test_abc',
      payment_status: 'paid',
    }));
    expect(chain.eq).toHaveBeenCalledWith('id', TEST_ID);
  });

  it('can set payment_status to error', async () => {
    const chain = makeUpdateChain({ error: null });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    await updateBriefWithContent({
      briefId: TEST_ID,
      visaRequest: VISA_REQUEST,
      brief: VISA_BRIEF,
      stripeSessionId: 'cs_test_abc',
      paymentStatus: 'error',
    });

    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'error' }));
  });

  it('throws when Supabase returns an error', async () => {
    const chain = makeUpdateChain({ error: { message: 'update failed' } });
    mockGetSupabase.mockReturnValue({ from: chain.from } as unknown as SupabaseClient);

    await expect(updateBriefWithContent({
      briefId: TEST_ID,
      visaRequest: VISA_REQUEST,
      brief: VISA_BRIEF,
      stripeSessionId: 'cs_test_abc',
      paymentStatus: 'paid',
    })).rejects.toThrow('update failed');
  });
});
