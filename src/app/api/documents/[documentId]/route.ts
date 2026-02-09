import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { deleteObject } from '@/lib/minio/presign';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId } = await params;

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, session.user.id),
    ),
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { documentId } = await params;
  const userId = session.user.id;

  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, userId),
    ),
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Delete from MinIO
  await deleteObject(doc.fileKey);

  // If this was the latest version, promote the previous version
  if (doc.isLatest) {
    const previousVersion = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.documentType, doc.documentType),
        ),
      )
      .orderBy(desc(documents.version))
      .limit(2);

    // Find a candidate that isn't the current doc being deleted
    const candidate = previousVersion.find((d) => d.id !== documentId);
    if (candidate) {
      await db
        .update(documents)
        .set({ isLatest: true })
        .where(eq(documents.id, candidate.id));
    }
  }

  // Delete from database
  await db.delete(documents).where(eq(documents.id, documentId));

  return NextResponse.json({ message: 'Document deleted' });
}
