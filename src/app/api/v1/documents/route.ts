import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { documentTypeEnum } from '@/db/schema/enums';
import { withApiToken } from '@/lib/api/v1/with-token';
import { apiOk, apiError } from '@/lib/api/v1/response';

type DocType = (typeof documentTypeEnum.enumValues)[number];

export const GET = withApiToken('read', async (request, _ctx, { userId }) => {
  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type');
  const roleFilter = searchParams.get('roleId');

  const conditions = [eq(documents.userId, userId), eq(documents.isLatest, true)];

  if (typeFilter) {
    if (!documentTypeEnum.enumValues.includes(typeFilter as DocType)) {
      return apiError('invalid_filter', 'Invalid type filter', 400);
    }
    conditions.push(eq(documents.documentType, typeFilter as DocType));
  }

  if (roleFilter) {
    conditions.push(eq(documents.roleCategoryId, roleFilter));
  }

  const rows = await db
    .select()
    .from(documents)
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));

  return apiOk(rows);
});
