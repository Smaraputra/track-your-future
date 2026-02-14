import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { createPresignedInlineUrl } from '@/lib/minio/presign';

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

  const url = await createPresignedInlineUrl(doc.fileKey, doc.fileName);

  return NextResponse.json({
    url,
    mimeType: doc.mimeType,
    fileName: doc.fileName,
  });
}
