import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  let healthy = true;

  // PostgreSQL check
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    healthy = false;
  }

  // Redis check
  try {
    if (redis) {
      await redis.ping();
    }
  } catch {
    healthy = false;
  }

  const status = healthy ? 'healthy' : 'degraded';
  return NextResponse.json(
    { status },
    { status: healthy ? 200 : 503 },
  );
}
