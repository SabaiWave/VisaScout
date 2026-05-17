import { isAdminEmail } from '@/src/lib/adminAccess';

describe('isAdminEmail', () => {
  const original = process.env.ADMIN_EMAIL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = original;
    }
  });

  it('returns false when ADMIN_EMAIL not set', () => {
    delete process.env.ADMIN_EMAIL;
    expect(isAdminEmail('admin@example.com')).toBe(false);
  });

  it('returns true for matching email', () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    expect(isAdminEmail('admin@example.com')).toBe(true);
  });

  it('returns false for non-matching email', () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    expect(isAdminEmail('other@example.com')).toBe(false);
  });

  it('is case-sensitive', () => {
    process.env.ADMIN_EMAIL = 'Admin@example.com';
    expect(isAdminEmail('admin@example.com')).toBe(false);
  });

  it('returns false for empty string when ADMIN_EMAIL set', () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    expect(isAdminEmail('')).toBe(false);
  });
});
