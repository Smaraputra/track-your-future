import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { detectStaleApps } from '@/lib/notifications/stale-detection';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    );
  }

  const expected = `Bearer ${cronSecret}`;
  if (
    !authHeader ||
    authHeader.length !== expected.length ||
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = {
    usersProcessed: 0,
    notificationsCreated: 0,
    errors: [] as string[],
  };

  try {
    // Get distinct user IDs with non-terminal applications
    const users = await db.execute<{ user_id: string }>(
      sql`SELECT DISTINCT user_id FROM applications WHERE current_status NOT IN ('offer', 'rejected', 'ghosted', 'withdrawn')`,
    );

    for (const row of users) {
      try {
        const created = await detectStaleApps(row.user_id);
        result.usersProcessed++;
        result.notificationsCreated += created;
      } catch (err) {
        result.errors.push(
          `User ${row.user_id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      }
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Failed to query users',
        detail: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
