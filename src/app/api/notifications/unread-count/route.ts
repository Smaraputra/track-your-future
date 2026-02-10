import { NextResponse } from 'next/server';
import { and, count, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema/notifications';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false),
      ),
    );

  return NextResponse.json({ count: result.count });
}
