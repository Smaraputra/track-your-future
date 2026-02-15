import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { documents, roleCategories } from '@/db/schema/core';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { presignRequestSchema } from '@/lib/documents/schemas';
import { buildFileKey } from '@/lib/documents/file-key';
import { createPresignedPutUrl } from '@/lib/minio/presign';
import { checkRateLimit } from '@/lib/rate-limit';
import { PRESIGN_LIMIT } from '@/lib/rate-limit-configs';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const rl = await checkRateLimit(`presign:${userId}`, PRESIGN_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many upload requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = presignRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { fileName, mimeType, fileSizeBytes, documentType, customTypeName, roleCategoryId, previousDocumentId } = parsed.data;

  const sub = await getUserSubscription(userId);

  // Check document limit
  const docLimit = await checkResourceLimit(userId, 'documents', sub.tier);
  if (!previousDocumentId && !docLimit.allowed) {
    return NextResponse.json(
      {
        error: `Document limit reached (${docLimit.limit}). Upgrade to Pro for unlimited documents.`,
        limit: docLimit.limit,
        current: docLimit.current,
      },
      { status: 403 },
    );
  }

  // Check storage limit (current + new file size)
  const storageLimit = await checkResourceLimit(userId, 'storageBytes', sub.tier);
  if (storageLimit.limit !== null && storageLimit.current + fileSizeBytes > storageLimit.limit) {
    return NextResponse.json(
      {
        error: 'Storage limit exceeded. Upgrade to Pro for more storage.',
        limit: storageLimit.limit,
        current: storageLimit.current,
      },
      { status: 403 },
    );
  }

  // Verify role ownership if provided
  if (roleCategoryId) {
    const role = await db.query.roleCategories.findFirst({
      where: and(
        eq(roleCategories.id, roleCategoryId),
        eq(roleCategories.userId, userId),
      ),
    });
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }
  }

  // Handle versioning
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
      return NextResponse.json(
        { error: 'Previous document not found or is not the latest version' },
        { status: 404 },
      );
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

  return NextResponse.json({
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
}
