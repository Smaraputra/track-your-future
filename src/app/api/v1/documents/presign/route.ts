import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { documents, roleCategories } from '@/db/schema/core';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { presignRequestSchema } from '@/lib/documents/schemas';
import { buildFileKey } from '@/lib/documents/file-key';
import { createPresignedPutUrl } from '@/lib/minio/presign';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

export const POST = withApiToken('write', async (request, _ctx, { userId }) => {
  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = presignRequestSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const {
    fileName,
    mimeType,
    fileSizeBytes,
    documentType,
    customTypeName,
    roleCategoryId,
    previousDocumentId,
  } = parsed.data;

  const sub = await getUserSubscription(userId);

  const docLimit = await checkResourceLimit(userId, 'documents', sub.tier);
  if (!previousDocumentId && !docLimit.allowed) {
    return apiError(
      'limit_reached',
      `Document limit reached (${docLimit.limit}). Upgrade to Pro for unlimited documents.`,
      403,
      { details: { limit: docLimit.limit, current: docLimit.current } },
    );
  }

  const storageLimit = await checkResourceLimit(userId, 'storageBytes', sub.tier);
  if (storageLimit.limit !== null && storageLimit.current + fileSizeBytes > storageLimit.limit) {
    return apiError('limit_reached', 'Storage limit exceeded. Upgrade to Pro for more storage.', 403, {
      details: { limit: storageLimit.limit, current: storageLimit.current },
    });
  }

  if (roleCategoryId) {
    const role = await db.query.roleCategories.findFirst({
      where: and(eq(roleCategories.id, roleCategoryId), eq(roleCategories.userId, userId)),
    });
    if (!role) return apiError('not_found', 'Role not found', 404);
  }

  let version = 1;
  if (previousDocumentId) {
    const prevDoc = await db.query.documents.findFirst({
      where: and(
        eq(documents.id, previousDocumentId),
        eq(documents.userId, userId),
        eq(documents.isLatest, true),
      ),
    });
    if (!prevDoc) {
      return apiError('not_found', 'Previous document not found or is not the latest version', 404);
    }
    version = prevDoc.version + 1;
  }

  const documentId = randomUUID();
  const fileKey = buildFileKey({
    userId,
    roleCategoryId,
    documentType,
    documentId,
    version,
    fileName,
  });

  const uploadUrl = await createPresignedPutUrl(fileKey, mimeType, fileSizeBytes);

  return apiOk({
    documentId,
    fileKey,
    uploadUrl,
    version,
    fileName,
    mimeType,
    fileSizeBytes,
    documentType,
    customTypeName,
    roleCategoryId,
    previousDocumentId,
  });
});
