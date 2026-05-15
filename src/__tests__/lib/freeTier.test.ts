import { FREE_DAILY_LIMIT, checkFreeTierCap, incrementFreeTierCount, logIpAbuse } from '../../lib/freeTier';

// Mock getSupabase
jest.mock('../../lib/supabase', () => ({
  getSupabase: jest.fn(),
}));

import { getSupabase } from '../../lib/supabase';

const mockGetSupabase = getSupabase as jest.Mock;

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  const mock = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  mockGetSupabase.mockReturnValue(mock);
  return mock;
}

describe('freeTier', () => {
  afterEach(() => jest.clearAllMocks());

  describe('FREE_DAILY_LIMIT', () => {
    it('is 1 brief per day', () => {
      expect(FREE_DAILY_LIMIT).toBe(1);
    });
  });

  describe('checkFreeTierCap', () => {
    it('allows when no record exists (count = 0)', async () => {
      const mock = makeSupabaseMock();
      mock.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await checkFreeTierCap('user_abc');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('allows when count is below limit', async () => {
      const mock = makeSupabaseMock();
      mock.maybeSingle.mockResolvedValue({ data: { count: 0 }, error: null });

      const result = await checkFreeTierCap('user_abc');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('blocks when count equals limit', async () => {
      const mock = makeSupabaseMock();
      mock.maybeSingle.mockResolvedValue({ data: { count: 1 }, error: null });

      const result = await checkFreeTierCap('user_abc');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('blocks when count exceeds limit', async () => {
      const mock = makeSupabaseMock();
      mock.maybeSingle.mockResolvedValue({ data: { count: 5 }, error: null });

      const result = await checkFreeTierCap('user_abc');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('incrementFreeTierCount', () => {
    it('calls the rpc function with user_id and today date', async () => {
      const mock = makeSupabaseMock();
      const today = new Date().toISOString().split('T')[0];

      await incrementFreeTierCount('user_xyz');

      expect(mock.rpc).toHaveBeenCalledWith('increment_free_daily_count', {
        p_user_id: 'user_xyz',
        p_date: today,
      });
    });
  });

  describe('logIpAbuse', () => {
    it('inserts into ip_abuse_log with ip, user_id, and reason', async () => {
      const mock = makeSupabaseMock();
      mock.insert.mockResolvedValue({ data: null, error: null });

      await logIpAbuse('1.2.3.4', 'user_123', 'free_tier_daily_cap_exceeded');

      expect(mock.from).toHaveBeenCalledWith('ip_abuse_log');
      expect(mock.insert).toHaveBeenCalledWith({
        ip: '1.2.3.4',
        user_id: 'user_123',
        reason: 'free_tier_daily_cap_exceeded',
      });
    });
  });
});
