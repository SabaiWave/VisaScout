import { isAdminUser } from '@/src/lib/adminAccess';

describe('isAdminUser', () => {
  const original = process.env.ADMIN_USER_ID;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ADMIN_USER_ID;
    } else {
      process.env.ADMIN_USER_ID = original;
    }
  });

  it('returns false when ADMIN_USER_ID not set', () => {
    delete process.env.ADMIN_USER_ID;
    expect(isAdminUser('user_abc123')).toBe(false);
  });

  it('returns true for matching user ID', () => {
    process.env.ADMIN_USER_ID = 'user_abc123';
    expect(isAdminUser('user_abc123')).toBe(true);
  });

  it('returns false for non-matching user ID', () => {
    process.env.ADMIN_USER_ID = 'user_abc123';
    expect(isAdminUser('user_xyz789')).toBe(false);
  });

  it('returns false for empty string when ADMIN_USER_ID set', () => {
    process.env.ADMIN_USER_ID = 'user_abc123';
    expect(isAdminUser('')).toBe(false);
  });
});
