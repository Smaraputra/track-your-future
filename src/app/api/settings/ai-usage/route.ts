import { NextResponse } from 'next/server';
import { and, count, eq, gte, sql } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { aiUsage } from '@/db/schema/ai';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const usage = await db
    .select({
      feature: aiUsage.feature,
      count: count(),
    })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, session.user.id),
        gte(aiUsage.createdAt, monthStart),
      ),
    )
    .groupBy(sql`${aiUsage.feature}`);

  return NextResponse.json({ usage, month: monthStart.toISOString() });
}
