import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis | null {
  if (!REDIS_URL) return null;

  try {
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    client.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    return client;
  } catch {
    console.error('Failed to create Redis client');
    return null;
  }
}

export const redis: Redis | null =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis;
}
