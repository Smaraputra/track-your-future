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

  it('records postgres status as up or down', () => {
    expect(routeSource).toContain("checks.postgres = { status: 'up'");
    expect(routeSource).toContain("checks.postgres = { status: 'down'");
  });

  it('checks Redis via ping', () => {
    expect(routeSource).toContain('redis.ping()');
  });

  it('handles missing Redis as not_configured', () => {
    expect(routeSource).toContain("status: 'not_configured'");
  });

  it('records redis status as up or down', () => {
    expect(routeSource).toContain("checks.redis = { status: 'up'");
    expect(routeSource).toContain("checks.redis = { status: 'down'");
  });

  it('measures latency per service', () => {
    expect(routeSource).toContain('Date.now() - pgStart');
    expect(routeSource).toContain('Date.now() - redisStart');
  });

  it('returns healthy (200) or degraded (503)', () => {
    expect(routeSource).toContain("'healthy'");
    expect(routeSource).toContain("'degraded'");
    expect(routeSource).toContain('healthy ? 200 : 503');
  });

  it('includes a timestamp in the response', () => {
    expect(routeSource).toContain('timestamp');
    expect(routeSource).toContain('new Date().toISOString()');
  });

  it('sets force-dynamic', () => {
    expect(routeSource).toContain("dynamic = 'force-dynamic'");
  });
});
