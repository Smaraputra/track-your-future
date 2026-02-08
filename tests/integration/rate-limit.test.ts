import { describe, expect, it, afterAll } from 'vitest';

const REDIS_URL = process.env.REDIS_URL;

describe.skipIf(!REDIS_URL)('Redis rate limiting integration', () => {
  let redis: Awaited<typeof import('@/lib/redis')>['redis'];

  afterAll(async () => {
    if (!redis) return;
    // Clean up test keys
    const keys = await redis.keys('rl:test-integration:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  });

  it('allows requests under the limit', async () => {
    const { redis: r } = await import('@/lib/redis');
    redis = r;
    if (!redis) return;

    const { checkRateLimit } = await import('@/lib/rate-limit');
    const key = `test-integration:${crypto.randomUUID()}`;

    const result = await checkRateLimit(key, {
      maxRequests: 3,
      windowSeconds: 60,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks after exceeding limit', async () => {
    if (!redis) return;

    const { checkRateLimit } = await import('@/lib/rate-limit');
    const key = `test-integration:${crypto.randomUUID()}`;
    const config = { maxRequests: 2, windowSeconds: 60 };

    // Use up the limit
    await checkRateLimit(key, config);
    await checkRateLimit(key, config);

    // Third request should be blocked
    const result = await checkRateLimit(key, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });
});
