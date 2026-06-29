import { buildCsp } from '../../lib/csp';

describe('buildCsp', () => {
  let csp: string;
  let directives: Record<string, string>;

  beforeAll(() => {
    csp = buildCsp();
    directives = Object.fromEntries(
      csp.split('; ').map(d => {
        const [key, ...rest] = d.trim().split(' ');
        return [key, rest.join(' ')];
      })
    );
  });

  describe('script-src', () => {
    it('allows Stripe JS', () => {
      expect(directives['script-src']).toContain('https://js.stripe.com');
    });

    it('allows Clerk dev CDN (pk_test_* instances)', () => {
      expect(directives['script-src']).toContain('https://*.clerk.accounts.dev');
    });

    it('allows Clerk production CDN (pk_live_* instances)', () => {
      expect(directives['script-src']).toContain('https://*.clerk.com');
    });

    it('allows Cloudflare bot challenge (required by Clerk)', () => {
      expect(directives['script-src']).toContain('https://challenges.cloudflare.com');
    });
  });

  describe('frame-src', () => {
    it('allows Stripe frames', () => {
      expect(directives['frame-src']).toContain('https://js.stripe.com');
      expect(directives['frame-src']).toContain('https://*.stripe.com');
    });

    it('allows Clerk dev frames', () => {
      expect(directives['frame-src']).toContain('https://*.clerk.accounts.dev');
    });

    it('allows Clerk production frames', () => {
      expect(directives['frame-src']).toContain('https://*.clerk.com');
    });
  });

  describe('security invariants', () => {
    it('blocks framing (frame-ancestors none)', () => {
      expect(directives['frame-ancestors']).toBe("'none'");
    });

    it('blocks object embeds', () => {
      expect(directives['object-src']).toBe("'none'");
    });
  });
});
