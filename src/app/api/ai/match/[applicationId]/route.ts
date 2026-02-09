import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { matchScores } from '@/db/schema/ai';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const score = await db.query.matchScores.findFirst({
    where: and(
      eq(matchScores.applicationId, applicationId),
      eq(matchScores.userId, session.user.id),
    ),
  });

  if (!score) {
    return NextResponse.json(
      { error: 'Match score not found' },
      { status: 404 },
    );
  }

  return NextResponse.json(score);
}
