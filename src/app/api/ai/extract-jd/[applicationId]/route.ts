import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { jobAnalyses } from '@/db/schema/ai';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const analysis = await db.query.jobAnalyses.findFirst({
    where: and(
      eq(jobAnalyses.applicationId, applicationId),
      eq(jobAnalyses.userId, session.user.id),
    ),
  });

  if (!analysis) {
    return NextResponse.json(
      { error: 'Job analysis not found' },
      { status: 404 },
    );
  }

  return NextResponse.json(analysis);
}
