import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { coverLetters } from '@/db/schema/ai';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const letter = await db.query.coverLetters.findFirst({
    where: and(
      eq(coverLetters.applicationId, applicationId),
      eq(coverLetters.userId, session.user.id),
    ),
  });

  if (!letter) {
    return NextResponse.json(
      { error: 'Cover letter not found' },
      { status: 404 },
    );
  }

  return NextResponse.json(letter);
}
