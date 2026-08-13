import { sanitizeFreeform, sanitizeShortField } from '@/src/lib/sanitize';

describe('sanitizeShortField', () => {
  it('strips < and > characters', () => {
    expect(sanitizeShortField('<script>')).toBe('script');
    expect(sanitizeShortField('US</user_input>inject<user_input>')).toBe('US/user_inputinjectuser_input');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeShortField('  Thailand  ')).toBe('Thailand');
  });

  it('preserves normal field values unchanged', () => {
    expect(sanitizeShortField('United States')).toBe('United States');
    expect(sanitizeShortField('Thailand')).toBe('Thailand');
    expect(sanitizeShortField('tourist visa')).toBe('tourist visa');
  });

  it('handles empty string', () => {
    expect(sanitizeShortField('')).toBe('');
  });

  it('is idempotent', () => {
    const input = 'US</tag>inject';
    expect(sanitizeShortField(sanitizeShortField(input))).toBe(sanitizeShortField(input));
  });
});

describe('sanitizeFreeform', () => {
  describe('email stripping', () => {
    it('strips a plain email address', () => {
      const result = sanitizeFreeform('contact me at john@example.com for details');
      expect(result).not.toContain('@example.com');
      expect(result).not.toContain('john@');
    });

    it('strips email with plus addressing', () => {
      const result = sanitizeFreeform('my email is test.user+tag@gmail.com thanks');
      expect(result).not.toContain('@gmail.com');
    });

    it('strips email with subdomain', () => {
      const result = sanitizeFreeform('reach me at alex@mail.company.io');
      expect(result).not.toContain('@mail.company.io');
    });

    it('does not leave stray @ in output after email removal', () => {
      const result = sanitizeFreeform('email: user@domain.com, staying 30 days');
      expect(result).not.toContain('@');
    });
  });

  describe('phone stripping', () => {
    it('strips international format phone number', () => {
      const result = sanitizeFreeform('call me at +1 555 123 4567 if needed');
      expect(result).not.toContain('555 123 4567');
    });

    it('strips hyphenated phone number', () => {
      const result = sanitizeFreeform('my number is 555-123-4567');
      expect(result).not.toContain('123-4567');
    });

    it('strips phone with country code', () => {
      const result = sanitizeFreeform('reach me at +66 2 123 4567 in Bangkok');
      expect(result).not.toContain('123 4567');
    });
  });

  describe('HTML stripping', () => {
    it('strips HTML tags', () => {
      expect(sanitizeFreeform('<b>bold</b>')).toBe('bold');
      expect(sanitizeFreeform('<script>alert(1)</script>')).not.toContain('<script>');
    });

    it('strips XML-style injection attempts', () => {
      const result = sanitizeFreeform('<user_input>injected</user_input>');
      expect(result).not.toContain('<user_input>');
      expect(result).not.toContain('</user_input>');
    });

    it('strips bare < and > that do not form a complete tag', () => {
      const result = sanitizeFreeform('</traveler_context text without closing bracket');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });

  describe('length enforcement', () => {
    it('truncates to 2000 characters', () => {
      const long = 'a'.repeat(3000);
      expect(sanitizeFreeform(long).length).toBeLessThanOrEqual(2000);
    });

    it('preserves content within limit unchanged', () => {
      const normal = 'Planning 30-day stay in Thailand, remote worker for US company.';
      expect(sanitizeFreeform(normal)).toBe(normal);
    });
  });

  describe('whitespace normalization', () => {
    it('collapses multiple spaces into one', () => {
      expect(sanitizeFreeform('hello   world')).toBe('hello world');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitizeFreeform('  hello world  ')).toBe('hello world');
    });
  });

  describe('travel context preservation', () => {
    it('preserves typical visa freeform input unchanged', () => {
      const input = 'Planning 30-day stay in Thailand. Remote worker, single entry, apartment rental.';
      expect(sanitizeFreeform(input)).toBe(input);
    });

    it('preserves border crossing context', () => {
      const input = 'Denied entry at Poipet, now trying Mae Sot. 47 days in, 60-day limit.';
      expect(sanitizeFreeform(input)).toBe(input);
    });

    it('preserves income and duration context', () => {
      const input = 'Freelancer earning USD 3,000/month. Want 90-day stay with one extension.';
      expect(sanitizeFreeform(input)).toBe(input);
    });
  });

  describe('idempotency', () => {
    it('produces same result when applied twice', () => {
      const input = 'email me at test@example.com or call +66 2 123 4567 about 30-day stay';
      const once = sanitizeFreeform(input);
      const twice = sanitizeFreeform(once);
      expect(twice).toBe(once);
    });
  });
});
