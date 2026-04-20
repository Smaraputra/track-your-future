import { createHash } from 'crypto';

import { redis } from '@/lib/redis';

export const LOGIN_FAILURE_THRESHOLD = 10;
export const LOGIN_FAILURE_WINDOW_SECONDS = 60 * 60;

const LOCKOUT_NOTIFIED_TTL_SECONDS = 60 * 60 * 24;

export function hashEmailForKey(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

function failuresKey(emailHash: string): string {
  return `login-fail:email:${emailHash}`;
}

function notifiedKey(emailHash: string): string {
  return `login-fail:notified:${emailHash}`;
}

export async function getLoginFailureCount(emailHash: string): Promise<number> {
  if (!redis) return 0;
  try {
    const value = await redis.get(failuresKey(emailHash));
    return value ? Number(value) : 0;
  } catch {
    return 0;
  }
}

export async function isEmailLockedOut(emailHash: string): Promise<boolean> {
  if (!redis) return true;
  const count = await getLoginFailureCount(emailHash);
  return count >= LOGIN_FAILURE_THRESHOLD;
}

export async function recordLoginFailure(emailHash: string): Promise<number> {
  if (!redis) return LOGIN_FAILURE_THRESHOLD;
  try {
    const key = failuresKey(emailHash);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, LOGIN_FAILURE_WINDOW_SECONDS);
    }
    return count;
  } catch {
    return LOGIN_FAILURE_THRESHOLD;
  }
}

export async function clearLoginFailures(emailHash: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(failuresKey(emailHash), notifiedKey(emailHash));
  } catch {
    // swallow; lockout will decay via TTL
  }
}

export async function shouldSendLockoutNotification(
  emailHash: string,
): Promise<boolean> {
  if (!redis) return false;
  try {
    const ok = await redis.set(
      notifiedKey(emailHash),
      '1',
      'EX',
      LOCKOUT_NOTIFIED_TTL_SECONDS,
      'NX',
    );
    return ok === 'OK';
  } catch {
    return false;
  }
}
