import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock Redis before importing rate-limit
vi.mock('@/lib/redis', () => ({
  redis: null,
}));

import { checkRateLimit } from '@/lib/rate-limit';

describe('rate limiter (no Redis)', () => {
  it('allows requests when Redis is unavailable (fail open)', async () => {
    const result = await checkRateLimit('test-key', {
      maxRequests: 5,
      windowSeconds: 60,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.retryAfterSeconds).toBe(0);
  });
});

describe('rate limiter (mock Redis)', () => {
  const mockPipeline = {
    zremrangebyscore: vi.fn().mockReturnThis(),
    zcard: vi.fn().mockReturnThis(),
    zadd: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn(),
  };

  const mockRedis = {
    pipeline: vi.fn(() => mockPipeline),
    zrange: vi.fn(),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('allows requests under limit', async () => {
    vi.doMock('@/lib/redis', () => ({ redis: mockRedis }));
    const { checkRateLimit: checkRL } = await import('@/lib/rate-limit');

    // First pipeline: cleanup + count
    mockPipeline.exec
      .mockResolvedValueOnce([
        [null, 0], // zremrangebyscore
        [null, 2], // zcard: 2 existing requests
      ])
      // Second pipeline: add + expire
      .mockResolvedValueOnce([
        [null, 1], // zadd
        [null, 1], // expire
      ]);

    const result = await checkRL('test', { maxRequests: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // 5 - 2 - 1 = 2
  });

  it('blocks requests over limit', async () => {
    vi.doMock('@/lib/redis', () => ({ redis: mockRedis }));
    const { checkRateLimit: checkRL } = await import('@/lib/rate-limit');

    mockPipeline.exec.mockResolvedValueOnce([
      [null, 0], // zremrangebyscore
      [null, 5], // zcard: 5 existing (at limit)
    ]);

    const now = Date.now();
    mockRedis.zrange.mockResolvedValueOnce([
      `${now - 10000}:0.5`,
      String(now - 10000),
    ]);

    const result = await checkRL('test', { maxRequests: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('fails open on Redis error', async () => {
    vi.doMock('@/lib/redis', () => ({ redis: mockRedis }));
    const { checkRateLimit: checkRL } = await import('@/lib/rate-limit');

    mockPipeline.exec.mockRejectedValueOnce(new Error('Redis down'));

    const result = await checkRL('test', { maxRequests: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
  });
});
