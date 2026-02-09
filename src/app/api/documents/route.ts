import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { documents, roleCategories } from '@/db/schema/core';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type');
  const roleFilter = searchParams.get('roleId');

  const conditions = [
    eq(documents.userId, session.user.id),
    eq(documents.isLatest, true),
  ];

  if (typeFilter) {
    conditions.push(eq(documents.documentType, typeFilter as never));
  }

  if (roleFilter) {
    conditions.push(eq(documents.roleCategoryId, roleFilter));
  }

  const rows = await db
    .select({
      id: documents.id,
      userId: documents.userId,
      roleCategoryId: documents.roleCategoryId,
      documentType: documents.documentType,
      customTypeName: documents.customTypeName,
      fileName: documents.fileName,
      fileKey: documents.fileKey,
      mimeType: documents.mimeType,
      fileSizeBytes: documents.fileSizeBytes,
      version: documents.version,
      isLatest: documents.isLatest,
      createdAt: documents.createdAt,
      roleCategoryName: roleCategories.name,
      roleCategoryColor: roleCategories.color,
    })
    .from(documents)
    .leftJoin(roleCategories, eq(documents.roleCategoryId, roleCategories.id))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));

  return NextResponse.json(rows);
}
