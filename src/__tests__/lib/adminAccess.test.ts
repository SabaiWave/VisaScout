import { isAdminUser } from '@/src/lib/adminAccess';

describe('isAdminUser', () => {
  const original = process.env.ADMIN_USER_IDS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ADMIN_USER_IDS;
    } else {
      process.env.ADMIN_USER_IDS = original;
    }
  });

  it('returns false when ADMIN_USER_IDS not set', () => {
    delete process.env.ADMIN_USER_IDS;
    expect(isAdminUser('user_abc123')).toBe(false);
  });

  it('returns true for single matching user ID', () => {
    process.env.ADMIN_USER_IDS = 'user_abc123';
    expect(isAdminUser('user_abc123')).toBe(true);
  });

  it('returns false for non-matching user ID', () => {
    process.env.ADMIN_USER_IDS = 'user_abc123';
    expect(isAdminUser('user_xyz789')).toBe(false);
  });

  it('returns false for empty string userId', () => {
    process.env.ADMIN_USER_IDS = 'user_abc123';
    expect(isAdminUser('')).toBe(false);
  });

  it('returns true for any ID in comma-separated list', () => {
    process.env.ADMIN_USER_IDS = 'user_abc123,user_xyz789';
    expect(isAdminUser('user_abc123')).toBe(true);
    expect(isAdminUser('user_xyz789')).toBe(true);
  });

  it('trims whitespace around IDs', () => {
    process.env.ADMIN_USER_IDS = ' user_abc123 , user_xyz789 ';
    expect(isAdminUser('user_abc123')).toBe(true);
    expect(isAdminUser('user_xyz789')).toBe(true);
  });

  it('returns false for non-matching ID in list', () => {
    process.env.ADMIN_USER_IDS = 'user_abc123,user_xyz789';
    expect(isAdminUser('user_other')).toBe(false);
  });
});
