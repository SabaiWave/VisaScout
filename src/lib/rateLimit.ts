import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let limiter: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (limiter) return limiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
    prefix: `visascout:brief:${process.env.ENVIRONMENT ?? 'development'}`,
  });
  return limiter;
}

// In-memory fallback: 5 requests per 60 seconds per key
// Activates when Upstash env vars are absent (dev / preview without Redis configured)
const inMemoryWindows = new Map<string, number[]>();
const IN_MEMORY_WINDOW_MS = 60_000;
const IN_MEMORY_LIMIT = 5;

function checkInMemoryLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - IN_MEMORY_WINDOW_MS;
  const timestamps = (inMemoryWindows.get(key) ?? []).filter(t => t > windowStart);
  if (timestamps.length >= IN_MEMORY_LIMIT) {
    const retryAfter = Math.ceil((timestamps[0] + IN_MEMORY_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }
  timestamps.push(now);
  inMemoryWindows.set(key, timestamps);
  return { allowed: true };
}

export async function checkRateLimit(userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const rl = getRateLimiter();
  if (!rl) return checkInMemoryLimit(userId);
  const { success, reset } = await rl.limit(userId);
  if (!success) {
    return { allowed: false, retryAfter: Math.ceil((reset - Date.now()) / 1000) };
  }
  return { allowed: true };
}
