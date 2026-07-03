/**
 * Tests for src/lib/inviteAccess.ts
 * Mocks Supabase — zero real DB calls.
 */

jest.mock('../../lib/supabase', () => ({ getSupabase: jest.fn() }));

import { getSupabase } from '../../lib/supabase';
import {
  hasInviteAccess,
  redeemInviteCode,
  incrementInviteUsage,
  revokeInviteAccess,
} from '../../lib/inviteAccess';

const mockGetSupabase = getSupabase as jest.Mock;

type ChainMock = {
  from: jest.Mock; select: jest.Mock; eq: jest.Mock; is: jest.Mock; not: jest.Mock;
  update: jest.Mock; insert: jest.Mock;
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

// ─── hasInviteAccess ──────────────────────────────────────────────────────────

describe('hasInviteAccess', () => {
  it('returns true when active invite row exists in users table', async () => {
    const mock = makeChain();
    mock.single.mockResolvedValue({ data: { id: 'row-1' }, error: null });
    expect(await hasInviteAccess('user_1')).toBe(true);
    expect(mock.not).toHaveBeenCalledWith('invite_code', 'is', null);
    expect(mock.is).toHaveBeenCalledWith('invite_revoked_at', null);
  });

  it('returns false when no row exists', async () => {
    makeChain();
    expect(await hasInviteAccess('user_1')).toBe(false);
  });

  it('returns false when query errors', async () => {
    const mock = makeChain();
    mock.single.mockResolvedValue({ data: null, error: new Error('db error') });
    expect(await hasInviteAccess('user_1')).toBe(false);
  });
});

// ─── redeemInviteCode ─────────────────────────────────────────────────────────

describe('redeemInviteCode', () => {
  it('returns 400 for invalid code without hitting DB', async () => {
    const mock = makeChain();
    const result = await redeemInviteCode('user_1', 'bad-code');
    expect(result).toEqual({ ok: false, error: 'Invalid invite code.', status: 400 });
    expect(mock.from).not.toHaveBeenCalled();
  });

  it('returns ok:true (idempotent) when user already has active access', async () => {
    const mock = makeChain();
    mock.single.mockResolvedValueOnce({ data: { id: 'row-1' }, error: null });
    const result = await redeemInviteCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: true });
    expect(mock.single).toHaveBeenCalledTimes(1);
  });

  it('returns 409 when code is already used by another account', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })              // not active member
      .mockResolvedValueOnce({ data: { id: 'other' }, error: null }); // code already used
    const result = await redeemInviteCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: false, error: 'This invite code has already been used.', status: 409 });
  });

  it('inserts new row for fresh user with correct fields (no access_type)', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null }) // not active member
      .mockResolvedValueOnce({ data: null, error: null }) // code not used
      .mockResolvedValueOnce({ data: null, error: null }); // no existing user row
    const result = await redeemInviteCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: true });
    expect(mock.insert).toHaveBeenCalledWith(expect.objectContaining({
      clerk_user_id: 'user_1',
      invite_code: VALID_CODE,
      invited_at: expect.any(String),
    }));
    expect(mock.insert).toHaveBeenCalledWith(expect.not.objectContaining({ access_type: expect.anything() }));
    expect(mock.update).not.toHaveBeenCalled();
  });

  it('returns 500 when insert fails', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    mock.error = new Error('constraint violation');
    const result = await redeemInviteCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: false, error: 'Failed to redeem code. Please try again.', status: 500 });
  });

  it('upgrades existing free user or re-activates revoked user via UPDATE (no access_type)', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })                    // not active member
      .mockResolvedValueOnce({ data: null, error: null })                    // code not used
      .mockResolvedValueOnce({ data: { id: 'existing-row' }, error: null }); // existing user found
    const result = await redeemInviteCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: true });
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({
      invite_code: VALID_CODE,
      invited_at: expect.any(String),
      invite_revoked_at: null,
    }));
    expect(mock.update).toHaveBeenCalledWith(expect.not.objectContaining({ access_type: expect.anything() }));
    expect(mock.insert).not.toHaveBeenCalled();
  });

  it('returns 500 when UPDATE fails', async () => {
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: 'existing-row' }, error: null });
    mock.error = new Error('db error');
    const result = await redeemInviteCode('user_1', VALID_CODE);
    expect(result).toEqual({ ok: false, error: 'Failed to redeem code. Please try again.', status: 500 });
  });

  it('accepts multiple comma-separated valid codes', async () => {
    process.env.INVITE_CODES = `${VALID_CODE},second-code`;
    const mock = makeChain();
    mock.single
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const result = await redeemInviteCode('user_2', 'second-code');
    expect(result).toEqual({ ok: true });
    process.env.INVITE_CODES = VALID_CODE;
  });
});

// ─── incrementInviteUsage ─────────────────────────────────────────────────────

describe('incrementInviteUsage', () => {
  it('calls increment_invite_usage RPC with correct user_id', async () => {
    const mock = makeChain();
    await incrementInviteUsage('user_1');
    expect(mock.rpc).toHaveBeenCalledWith('increment_invite_usage', { p_user_id: 'user_1' });
  });
});

// ─── revokeInviteAccess ───────────────────────────────────────────────────────

describe('revokeInviteAccess', () => {
  it('sets invite_revoked_at on users table by clerk_user_id', async () => {
    const mock = makeChain();
    await revokeInviteAccess('user_1');
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({ invite_revoked_at: expect.any(String) })
    );
    expect(mock.eq).toHaveBeenCalledWith('clerk_user_id', 'user_1');
    expect(mock.is).toHaveBeenCalledWith('invite_revoked_at', null);
  });
});
