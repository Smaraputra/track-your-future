import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { interviewPreps } from '@/db/schema/ai';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const prep = await db.query.interviewPreps.findFirst({
    where: and(
      eq(interviewPreps.applicationId, applicationId),
      eq(interviewPreps.userId, session.user.id),
    ),
  });

  if (!prep) {
    return NextResponse.json(
      { error: 'Interview prep not found' },
      { status: 404 },
    );
  }

  return NextResponse.json(prep);
}
