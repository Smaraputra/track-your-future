import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number }> = {};
  let healthy = true;

  // PostgreSQL check
  const pgStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.postgres = { status: 'up', latencyMs: Date.now() - pgStart };
  } catch {
    checks.postgres = { status: 'down', latencyMs: Date.now() - pgStart };
    healthy = false;
  }

  // Redis check
  const redisStart = Date.now();
  try {
    if (redis) {
      await redis.ping();
      checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
    } else {
      checks.redis = { status: 'not_configured' };
    }
  } catch {
    checks.redis = { status: 'down', latencyMs: Date.now() - redisStart };
    healthy = false;
  }

  const status = healthy ? 'healthy' : 'degraded';
  return NextResponse.json(
    { status, checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}
