import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { deleteObject } from '@/lib/minio/presign';
import { withApiToken } from '@/lib/api/v1/with-token';
import { apiOk, apiError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ documentId: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { documentId } = await params;

  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, userId)),
  });
  if (!doc) return apiError('not_found', 'Document not found', 404);

  return apiOk(doc);
});

export const DELETE = withApiToken<Ctx>('write', async (_request, { params }, { userId }) => {
  const { documentId } = await params;

  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, userId)),
  });
  if (!doc) return apiError('not_found', 'Document not found', 404);

  await deleteObject(doc.fileKey);

  // If this was the latest version, promote the previous version.
  if (doc.isLatest) {
    const recent = await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.documentType, doc.documentType)))
      .orderBy(desc(documents.version))
      .limit(2);

    const candidate = recent.find((d) => d.id !== documentId);
    if (candidate) {
      await db
        .update(documents)
        .set({ isLatest: true })
        .where(eq(documents.id, candidate.id));
    }
  }

  await db.delete(documents).where(eq(documents.id, documentId));

  return apiOk({ success: true });
});
