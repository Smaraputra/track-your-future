import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/auth';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db
    .update(users)
    .set({ onboardingCompleted: true })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ success: true });
}
