import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Polar client module (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/polar.ts'),
    'utf-8',
  );

  it('imports Polar from @polar-sh/sdk', () => {
    expect(source).toContain("import { Polar } from '@polar-sh/sdk'");
  });

  it('returns null when POLAR_ACCESS_TOKEN is not set', () => {
    expect(source).toContain('if (!POLAR_ACCESS_TOKEN) return null');
  });

  it('uses globalThis singleton for dev hot reload', () => {
    expect(source).toContain('globalForPolar');
    expect(source).toContain("process.env.NODE_ENV !== 'production'");
  });

  it('exports polar as Polar | null', () => {
    expect(source).toContain('export const polar: Polar | null');
  });

  it('uses sandbox server in development', () => {
    expect(source).toContain("'production' ? 'production' : 'sandbox'");
  });

  it('reads access token from env', () => {
    expect(source).toContain('process.env.POLAR_ACCESS_TOKEN');
  });
});
