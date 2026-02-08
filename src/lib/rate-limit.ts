import { redis } from '@/lib/redis';

export interface RateLimitConfig {
  /** Max number of requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 * Falls open (allows the request) if Redis is unavailable.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (!redis) {
    return { allowed: true, remaining: config.maxRequests, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  const windowStart = now - config.windowSeconds * 1000;
  const fullKey = `rl:${key}`;

  try {
    // Clean up old entries and count current ones
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(fullKey, 0, windowStart);
    pipeline.zcard(fullKey);
    const results = await pipeline.exec();

    if (!results) {
      return { allowed: true, remaining: config.maxRequests, retryAfterSeconds: 0 };
    }

    const currentCount = (results[1][1] as number) ?? 0;

    if (currentCount >= config.maxRequests) {
      // Over limit -- compute retry-after from oldest entry
      const oldestEntries = await redis.zrange(fullKey, 0, 0, 'WITHSCORES');
      const oldestTimestamp =
        oldestEntries.length >= 2 ? Number(oldestEntries[1]) : now;
      const retryAfterMs =
        oldestTimestamp + config.windowSeconds * 1000 - now;

      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(Math.max(retryAfterMs, 0) / 1000),
      };
    }

    // Under limit -- record this request
    const addPipeline = redis.pipeline();
    addPipeline.zadd(fullKey, now.toString(), `${now}:${Math.random()}`);
    addPipeline.expire(fullKey, config.windowSeconds);
    await addPipeline.exec();

    return {
      allowed: true,
      remaining: config.maxRequests - currentCount - 1,
      retryAfterSeconds: 0,
    };
  } catch {
    // Redis error -- fail open
    return { allowed: true, remaining: config.maxRequests, retryAfterSeconds: 0 };
  }
}
