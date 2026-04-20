import { redis } from '@/lib/redis';

const KEY_TTL_SECONDS = 60 * 60 * 24 * 90;

function invalidationKey(userId: string): string {
  return `session-invalidate-after:${userId}`;
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  if (!redis) return;
  const nowSeconds = Math.floor(Date.now() / 1000);
  try {
    await redis.set(invalidationKey(userId), String(nowSeconds), 'EX', KEY_TTL_SECONDS);
  } catch (err) {
    console.error('Failed to record session invalidation', err);
  }
}

export async function isSessionStillValid(
  userId: string,
  signedInAtSeconds: number | undefined,
): Promise<boolean> {
  if (!redis) return true;
  if (typeof signedInAtSeconds !== 'number') return true;
  try {
    const value = await redis.get(invalidationKey(userId));
    if (!value) return true;
    const invalidatedAt = Number(value);
    if (!Number.isFinite(invalidatedAt)) return true;
    return signedInAtSeconds >= invalidatedAt;
  } catch {
    return true;
  }
}
