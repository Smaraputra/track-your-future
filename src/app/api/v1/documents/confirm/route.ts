import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { confirmUploadSchema } from '@/lib/documents/schemas';
import { headObject, deleteObject } from '@/lib/minio/presign';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

export const POST = withApiToken('write', async (request, _ctx, { userId }) => {
  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = confirmUploadSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const {
    documentId,
    fileKey,
    fileName,
    mimeType,
    documentType,
    customTypeName,
    roleCategoryId,
    version,
    previousDocumentId,
  } = parsed.data;

  // The fileKey embeds the owner's id (see buildFileKey). Reject keys that do
  // not belong to this user so a token cannot confirm an upload into another
  // tenant's namespace.
  if (!fileKey.startsWith(`${userId}/`)) {
    return apiError('forbidden', 'File key does not belong to this user', 403);
  }

  const objectInfo = await headObject(fileKey);
  if (!objectInfo) {
    return apiError('not_found', 'File not found in storage. Upload may have failed.', 404);
  }

  const actualSize = objectInfo.contentLength;

  const sub = await getUserSubscription(userId);
  const storageLimit = await checkResourceLimit(userId, 'storageBytes', sub.tier);
  if (storageLimit.limit !== null && storageLimit.current + actualSize > storageLimit.limit) {
    await deleteObject(fileKey);
    return apiError('limit_reached', 'Storage limit exceeded. File has been removed.', 403, {
      details: { limit: storageLimit.limit, current: storageLimit.current },
    });
  }

  const [created] = await db.transaction(async (tx) => {
    if (previousDocumentId) {
      await tx
        .update(documents)
        .set({ isLatest: false })
        .where(and(eq(documents.id, previousDocumentId), eq(documents.userId, userId)));
    }

    return tx
      .insert(documents)
      .values({
        id: documentId,
        userId,
        roleCategoryId: roleCategoryId ?? null,
        documentType,
        customTypeName: customTypeName ?? null,
        fileName,
        fileKey,
        mimeType,
        fileSizeBytes: actualSize,
        version,
        isLatest: true,
      })
      .returning();
  });

  return apiOk(created, 201);
});
