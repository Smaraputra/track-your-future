import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { resumeSuggestions } from '@/db/schema/ai';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const suggestion = await db.query.resumeSuggestions.findFirst({
    where: and(
      eq(resumeSuggestions.applicationId, applicationId),
      eq(resumeSuggestions.userId, session.user.id),
    ),
  });

  if (!suggestion) {
    return NextResponse.json(
      { error: 'Resume suggestions not found' },
      { status: 404 },
    );
  }

  return NextResponse.json(suggestion);
}
