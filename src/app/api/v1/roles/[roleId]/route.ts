import { and, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { roleCategories, documents, formFieldTemplates } from '@/db/schema/core';
import { applications } from '@/db/schema/applications';
import { updateRoleSchema } from '@/lib/roles/schemas';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ roleId: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { roleId } = await params;

  const role = await db.query.roleCategories.findFirst({
    where: and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)),
  });
  if (!role) return apiError('not_found', 'Role not found', 404);

  const [docCount] = await db
    .select({ count: count() })
    .from(documents)
    .where(eq(documents.roleCategoryId, roleId));
  const [appCount] = await db
    .select({ count: count() })
    .from(applications)
    .where(eq(applications.roleCategoryId, roleId));
  const [templateCount] = await db
    .select({ count: count() })
    .from(formFieldTemplates)
    .where(eq(formFieldTemplates.roleCategoryId, roleId));

  return apiOk({
    ...role,
    _counts: {
      documents: docCount.count,
      applications: appCount.count,
      formFieldTemplates: templateCount.count,
    },
  });
});

export const PATCH = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { roleId } = await params;

  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const existing = await db.query.roleCategories.findFirst({
    where: and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)),
  });
  if (!existing) return apiError('not_found', 'Role not found', 404);

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await db
      .select({ id: roleCategories.id })
      .from(roleCategories)
      .where(and(eq(roleCategories.userId, userId), eq(roleCategories.name, parsed.data.name)));
    if (duplicate.length > 0) {
      return apiError('conflict', 'A role category with this name already exists', 409);
    }
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description || null;
  }
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;

  if (Object.keys(updateData).length === 0) return apiOk(existing);

  const [updated] = await db
    .update(roleCategories)
    .set(updateData)
    .where(and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)))
    .returning();

  return apiOk(updated);
});

export const DELETE = withApiToken<Ctx>('write', async (_request, { params }, { userId }) => {
  const { roleId } = await params;

  const existing = await db.query.roleCategories.findFirst({
    where: and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)),
  });
  if (!existing) return apiError('not_found', 'Role not found', 404);

  await db
    .delete(roleCategories)
    .where(and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)));

  return apiOk({ success: true });
});
