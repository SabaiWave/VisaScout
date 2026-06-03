/**
 * Tests for src/lib/earlyAccess.ts
 * Mocks Supabase — zero real DB calls.
 *
 * Chain mock pattern: most methods return `this` (the mock object).
 * `.single()` returns a Promise (configurable via mockResolvedValueOnce).
 * `.insert()` / `.update().eq()` return `this` — awaiting a plain object
 * resolves to itself, so `{ error }` comes from `mock.error`.
 * Set `mock.error` before the call to simulate DB failures.
 */

jest.mock('../../lib/supabase', () => ({ getSupabase: jest.fn() }));

import { getSupabase } from '../../lib/supabase';
import {
  isEarlyAccessUser,
  redeemEarlyAccessCode,
  incrementEarlyAccessUsage,
  revokeEarlyAccess,
} from '../../lib/earlyAccess';

const mockGetSupabase = getSupabase as jest.Mock;

type ChainMock = {
  from: jest.Mock; select: jest.Mock; eq: jest.Mock; is: jest.Mock;
  not: jest.Mock; update: jest.Mock; insert: jest.Mock;
  single: jest.Mock; rpc: jest.Mock; error?: unknown;
};

function makeChain(): ChainMock {
  const mock = {
    from:   jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq:     jest.fn().mockReturnThis(),
    is:     jest.fn().mockReturnThis(),
    not:    jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    rpc:    jest.fn().mockResolvedValue({ data: null, error: null }),
  } as ChainMock;
  mockGetSupabase.mockReturnValue(mock);
  return mock;
}

const VALID_CODE = 'test-invite-uuid';
const originalInviteCodes = process.env.INVITE_CODES;

beforeAll(() => { process.env.INVITE_CODES = VALID_CODE; });
afterAll(() => {
  if (originalInviteCodes === undefined) delete process.env.INVITE_CODES;
  else process.env.INVITE_CODES = originalInviteCodes;
});
afterEach(() => jest.clearAllMocks());

// ─── isEarlyAccessUser ────────────────────────────────────────────────────────

describe('isEarlyAccessUser', () => {
  it('returns true when active (non-revoked) row exists', async () => {
    const mock = makeChain();
    mock.single.mockResolvedValue({ data: { id: 'row-1' }, error: null });
    expect(await isEarlyAccessUser('user_1')).toBe(true);
    expect(mock.is).toHaveBeenCalledWith('revoked_at', null);
  });

  it('returns false when no row exists', async () => {
    makeChain(); // single defaults to { data: null }
    expect(await isEarlyAccessUser('user_1')).toBe(false);
  });

  it('returns false when query errors', async () => {
    const mock = makeChain();
    mock.single.mockResolvedValue({ data: null, error: new Error('db error') });
    expect(await isEarlyAccessUser('user_1')).toBe(false);
  });
});

// ─── redeemEarlyAccessCode ────────────────────────────────────────────────────

describe('redeemEarlyAccessCode', () => {
  it('returns 400 for invalid code without hitting DB', async () => {
    const mock = makeChain();
    const result = await redeemEarlyAccessCode('user_1', 'bad-code');
    expect(result).toEqual({ ok: false, error: 'Invalid invite code.', status: 400 });
    expect(mock.from).not.toHaveBeenCalled();
  });

  it('returns ok:true (idempotent) when user already has active access', async () => {
    const mock = makeChain();
    mock.single.mockResolvedValueOnce({ data: { id: 'row-1' }, error: null }); // active member
    const result = await redeemEarlyAccessCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: true });
    expect(mock.single).toHaveBeenCalledTimes(1); // stops after active-member check
  });

  it('returns 409 when code is already used by another account', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })              // not active
      .mockResolvedValueOnce({ data: { id: 'other' }, error: null }); // code taken
    const result = await redeemEarlyAccessCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: false, error: 'This invite code has already been used.', status: 409 });
  });

  it('inserts new row for fresh user (no prior record)', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null }) // not active
      .mockResolvedValueOnce({ data: null, error: null }) // code not used
      .mockResolvedValueOnce({ data: null, error: null }); // no revoked row
    const result = await redeemEarlyAccessCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: true });
    expect(mock.insert).toHaveBeenCalledWith({ user_id: 'user_1', code_used: VALID_CODE });
    expect(mock.update).not.toHaveBeenCalled();
  });

  it('returns 500 when insert fails', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mock.error = new Error('constraint violation');
    const result = await redeemEarlyAccessCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: false, error: 'Failed to redeem code. Please try again.', status: 500 });
  });

  it('re-activates revoked user via UPDATE (no new insert)', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })                      // not active
      .mockResolvedValueOnce({ data: null, error: null })                      // code not used
      .mockResolvedValueOnce({ data: { id: 'revoked-row' }, error: null });    // revoked row found
    const result = await redeemEarlyAccessCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: true });
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ code_used: VALID_CODE, revoked_at: null })
    );
    expect(mock.insert).not.toHaveBeenCalled();
  });

  it('returns 500 when re-activation UPDATE fails', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'revoked-row' }, error: null });
    mock.error = new Error('db error');
    const result = await redeemEarlyAccessCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: false, error: 'Failed to redeem code. Please try again.', status: 500 });
  });

  it('accepts multiple comma-separated valid codes', async () => {
    process.env.INVITE_CODES = `${VALID_CODE},second-code`;
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const result = await redeemEarlyAccessCode('user_2', 'second-code');
    expect(result).toEqual({ ok: true });
    process.env.INVITE_CODES = VALID_CODE; // restore
  });
});

// ─── incrementEarlyAccessUsage ────────────────────────────────────────────────

describe('incrementEarlyAccessUsage', () => {
  it('calls RPC with correct user_id', async () => {
    const mock = makeChain();
    await incrementEarlyAccessUsage('user_1');
    expect(mock.rpc).toHaveBeenCalledWith('increment_early_access_usage', { p_user_id: 'user_1' });
  });
});

// ─── revokeEarlyAccess ────────────────────────────────────────────────────────

describe('revokeEarlyAccess', () => {
  it('sets revoked_at on the active row only', async () => {
    const mock = makeChain();
    await revokeEarlyAccess('user_1');
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ revoked_at: expect.any(String) })
    );
    expect(mock.eq).toHaveBeenCalledWith('user_id', 'user_1');
    expect(mock.is).toHaveBeenCalledWith('revoked_at', null);
  });
});
