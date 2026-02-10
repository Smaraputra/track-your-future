import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema/notifications';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return NextResponse.json(
    items.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  );
}
