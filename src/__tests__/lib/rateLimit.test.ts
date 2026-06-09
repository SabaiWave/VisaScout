/**
 * Tests for checkRateLimit.
 * Mocks @upstash/ratelimit and @upstash/redis — zero real network calls.
 */

const mockLimit = jest.fn();

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = jest.fn().mockReturnValue('sliding-window-config');
    limit = mockLimit;
  },
}));

jest.mock('@upstash/redis', () => ({
  Redis: class {},
}));

describe('checkRateLimit', () => {
  const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    jest.resetModules();
    mockLimit.mockReset();
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = originalUrl;
    if (originalToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
  });

  it('activates in-memory fallback when Upstash env vars not set — allows requests within limit', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit } = await import('@/src/lib/rateLimit');
    // First 5 requests for same userId: all allowed
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit('user_fallback');
      expect(result.allowed).toBe(true);
    }
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it('in-memory fallback blocks requests beyond the limit', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit } = await import('@/src/lib/rateLimit');
    // Exhaust the in-memory limit (5 req/60s)
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('user_over_limit');
    }
    const blocked = await checkRateLimit('user_over_limit');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(mockLimit).not.toHaveBeenCalled();
  });

  it('returns allowed:true when Upstash limit not exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token_abc';
    mockLimit.mockResolvedValue({ success: true, reset: Date.now() + 60000 });
    const { checkRateLimit } = await import('@/src/lib/rateLimit');
    const result = await checkRateLimit('user_123');
    expect(result.allowed).toBe(true);
  });

  it('returns allowed:false with retryAfter when limit exceeded', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token_abc';
    const resetAt = Date.now() + 30000;
    mockLimit.mockResolvedValue({ success: false, reset: resetAt });
    const { checkRateLimit } = await import('@/src/lib/rateLimit');
    const result = await checkRateLimit('user_123');
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
    expect(result.retryAfter).toBeLessThanOrEqual(30);
  });
});
