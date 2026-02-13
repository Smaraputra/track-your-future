import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

const routeSource = readFileSync(
  resolve(ROOT, 'src/app/api/cron/detect-stale/route.ts'),
  'utf-8',
);

describe('Cron detect-stale route', () => {
  it('exports a GET handler', () => {
    expect(routeSource).toContain('export async function GET');
  });

  it('checks CRON_SECRET env var', () => {
    expect(routeSource).toContain('process.env.CRON_SECRET');
  });

  it('returns 500 if CRON_SECRET is missing', () => {
    expect(routeSource).toContain('CRON_SECRET not configured');
    expect(routeSource).toContain('status: 500');
  });

  it('validates Bearer token from authorization header', () => {
    expect(routeSource).toContain("request.headers.get('authorization')");
    expect(routeSource).toContain('`Bearer ${cronSecret}`');
  });

  it('returns 401 for invalid token', () => {
    expect(routeSource).toContain('Unauthorized');
    expect(routeSource).toContain('status: 401');
  });

  it('queries distinct user IDs with non-terminal statuses', () => {
    expect(routeSource).toContain('SELECT DISTINCT user_id FROM applications');
    expect(routeSource).toContain('NOT IN');
  });

  it('excludes terminal statuses from query', () => {
    expect(routeSource).toContain("'offer'");
    expect(routeSource).toContain("'rejected'");
    expect(routeSource).toContain("'ghosted'");
    expect(routeSource).toContain("'withdrawn'");
  });

  it('calls detectStaleApps per user', () => {
    expect(routeSource).toContain('detectStaleApps(row.user_id)');
  });

  it('tracks usersProcessed count', () => {
    expect(routeSource).toContain('usersProcessed');
    expect(routeSource).toContain('result.usersProcessed++');
  });

  it('tracks notificationsCreated count', () => {
    expect(routeSource).toContain('notificationsCreated');
    expect(routeSource).toContain('result.notificationsCreated += created');
  });

  it('handles per-user errors without stopping the batch', () => {
    expect(routeSource).toContain('result.errors.push');
    expect(routeSource).toContain(`User \${row.user_id}`);
  });

  it('sets force-dynamic and maxDuration', () => {
    expect(routeSource).toContain("dynamic = 'force-dynamic'");
    expect(routeSource).toContain('maxDuration = 60');
  });
});
