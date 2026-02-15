import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

const routeSource = readFileSync(
  resolve(ROOT, 'src/app/api/health/route.ts'),
  'utf-8',
);

describe('Health route', () => {
  it('exports a GET handler', () => {
    expect(routeSource).toContain('export async function GET');
  });

  it('checks PostgreSQL via db.execute SELECT 1', () => {
    expect(routeSource).toContain('db.execute');
    expect(routeSource).toContain('SELECT 1');
  });

  it('checks Redis via ping', () => {
    expect(routeSource).toContain('redis.ping()');
  });

  it('returns healthy (200) or degraded (503)', () => {
    expect(routeSource).toContain("'healthy'");
    expect(routeSource).toContain("'degraded'");
    expect(routeSource).toContain('healthy ? 200 : 503');
  });

  it('does not leak infrastructure latency details', () => {
    expect(routeSource).not.toContain('latencyMs');
    expect(routeSource).not.toContain('checks');
    expect(routeSource).not.toContain('timestamp');
  });

  it('sets force-dynamic', () => {
    expect(routeSource).toContain("dynamic = 'force-dynamic'");
  });
});
