import { createHash } from 'crypto';

import { redis } from '@/lib/redis';
import { jdExtractedDataSchema, type JdExtractedData } from './schemas';

const KEY_PREFIX = 'jd:';
const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function hashUrl(url: string): string {
  return createHash('sha256')
    .update(url.trim().toLowerCase())
    .digest('hex');
}

interface CachedJd {
  data: JdExtractedData;
  rawText: string;
}

export async function getCachedJd(url: string): Promise<CachedJd | null> {
  if (!redis) return null;

  try {
    const key = `${KEY_PREFIX}${hashUrl(url)}`;
    const raw = await redis.get(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { data: unknown; rawText: string };
    const validated = jdExtractedDataSchema.safeParse(parsed.data);
    if (!validated.success) return null;

    return { data: validated.data, rawText: parsed.rawText };
  } catch {
    return null;
  }
}

export async function setCachedJd(
  url: string,
  data: JdExtractedData,
  rawText: string,
): Promise<void> {
  if (!redis) return;

  try {
    const key = `${KEY_PREFIX}${hashUrl(url)}`;
    await redis.setex(key, TTL_SECONDS, JSON.stringify({ data, rawText }));
  } catch {
    // Cache set failures are non-critical
  }
}
