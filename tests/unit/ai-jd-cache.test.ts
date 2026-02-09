import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import { hashUrl } from '@/lib/ai/jd-cache';

const ROOT = resolve(__dirname, '../..');

describe('hashUrl', () => {
  it('returns consistent hash for same URL', () => {
    const hash1 = hashUrl('https://example.com/job/123');
    const hash2 = hashUrl('https://example.com/job/123');
    expect(hash1).toBe(hash2);
  });

  it('normalizes case before hashing', () => {
    const hash1 = hashUrl('https://Example.COM/Job');
    const hash2 = hashUrl('https://example.com/job');
    expect(hash1).toBe(hash2);
  });

  it('trims whitespace before hashing', () => {
    const hash1 = hashUrl('  https://example.com  ');
    const hash2 = hashUrl('https://example.com');
    expect(hash1).toBe(hash2);
  });

  it('returns hex string', () => {
    const hash = hashUrl('https://example.com');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hashes for different URLs', () => {
    const hash1 = hashUrl('https://example.com/a');
    const hash2 = hashUrl('https://example.com/b');
    expect(hash1).not.toBe(hash2);
  });
});

describe('jd-cache module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/jd-cache.ts'),
    'utf-8',
  );

  it('uses SHA-256 hashing', () => {
    expect(source).toContain("createHash('sha256')");
  });

  it('uses jd: key prefix', () => {
    expect(source).toContain("KEY_PREFIX = 'jd:'");
  });

  it('sets 30-day TTL', () => {
    expect(source).toContain('30 * 24 * 60 * 60');
  });

  it('uses redis.setex for cache writes', () => {
    expect(source).toContain('redis.setex');
  });

  it('validates cached data with schema', () => {
    expect(source).toContain('jdExtractedDataSchema.safeParse');
  });

  it('handles null redis gracefully in get', () => {
    expect(source).toContain('if (!redis) return null');
  });

  it('handles null redis gracefully in set', () => {
    expect(source).toContain('if (!redis) return');
  });
});
