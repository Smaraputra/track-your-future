import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { createPresignedGetUrl } from '@/lib/minio/presign';
import { withApiToken } from '@/lib/api/v1/with-token';
import { apiOk, apiError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ documentId: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { documentId } = await params;

  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, documentId), eq(documents.userId, userId)),
  });
  if (!doc) return apiError('not_found', 'Document not found', 404);

  // Return the time-limited presigned URL as JSON so API consumers can fetch
  // the binary directly from object storage (no proxying through Node).
  const url = await createPresignedGetUrl(doc.fileKey, doc.fileName);

  return apiOk({ url, fileName: doc.fileName, expiresInSeconds: 3600 });
});
