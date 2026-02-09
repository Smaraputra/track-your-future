import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { confirmUploadSchema } from '@/lib/documents/schemas';
import { headObject, deleteObject } from '@/lib/minio/presign';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = confirmUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

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

  // Verify file exists in MinIO and get actual size
  const objectInfo = await headObject(fileKey);
  if (!objectInfo) {
    return NextResponse.json(
      { error: 'File not found in storage. Upload may have failed.' },
      { status: 404 },
    );
  }

  const actualSize = objectInfo.contentLength;

  // Re-check storage limit with actual size from headObject
  const sub = await getUserSubscription(userId);
  const storageLimit = await checkResourceLimit(userId, 'storageBytes', sub.tier);
  if (storageLimit.limit !== null && storageLimit.current + actualSize > storageLimit.limit) {
    await deleteObject(fileKey);
    return NextResponse.json(
      {
        error: 'Storage limit exceeded. File has been removed.',
        limit: storageLimit.limit,
        current: storageLimit.current,
      },
      { status: 403 },
    );
  }

  // Transaction: mark old version as not latest, insert new document
  const [created] = await db.transaction(async (tx) => {
    if (previousDocumentId) {
      await tx
        .update(documents)
        .set({ isLatest: false })
        .where(
          and(
            eq(documents.id, previousDocumentId),
            eq(documents.userId, userId),
          ),
        );
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

  return NextResponse.json(
    { ...created, canParse: created.documentType === 'cv' },
    { status: 201 },
  );
}
