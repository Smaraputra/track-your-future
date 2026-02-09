import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { parsedProfiles } from '@/db/schema/ai';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId } = await params;

  const profile = await db.query.parsedProfiles.findFirst({
    where: and(
      eq(parsedProfiles.documentId, documentId),
      eq(parsedProfiles.userId, session.user.id),
    ),
  });

  if (!profile) {
    return NextResponse.json(
      { error: 'Parsed profile not found' },
      { status: 404 },
    );
  }

  return NextResponse.json(profile);
}
