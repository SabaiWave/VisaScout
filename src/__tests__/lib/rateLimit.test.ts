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

  it('returns allowed:true when env vars not set — graceful no-op', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit } = await import('@/src/lib/rateLimit');
    const result = await checkRateLimit('user_123');
    expect(result).toEqual({ allowed: true });
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
