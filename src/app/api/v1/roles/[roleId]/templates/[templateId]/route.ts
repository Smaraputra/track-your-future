import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { formFieldTemplates, roleCategories } from '@/db/schema/core';
import { updateTemplateSchema } from '@/lib/templates/schemas';
import { encryptField, safeDecryptField } from '@/lib/crypto/field-encryption';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ roleId: string; templateId: string }> };

async function assertRole(roleId: string, userId: string) {
  return db.query.roleCategories.findFirst({
    where: and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)),
  });
}

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { roleId, templateId } = await params;

  const role = await assertRole(roleId, userId);
  if (!role) return apiError('not_found', 'Role not found', 404);

  const template = await db.query.formFieldTemplates.findFirst({
    where: and(
      eq(formFieldTemplates.id, templateId),
      eq(formFieldTemplates.roleCategoryId, roleId),
      eq(formFieldTemplates.userId, userId),
    ),
  });
  if (!template) return apiError('not_found', 'Template not found', 404);

  return apiOk({ ...template, fieldValue: safeDecryptField(template.fieldValue, userId) });
});

export const PATCH = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { roleId, templateId } = await params;

  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const role = await assertRole(roleId, userId);
  if (!role) return apiError('not_found', 'Role not found', 404);

  const existing = await db.query.formFieldTemplates.findFirst({
    where: and(
      eq(formFieldTemplates.id, templateId),
      eq(formFieldTemplates.roleCategoryId, roleId),
      eq(formFieldTemplates.userId, userId),
    ),
  });
  if (!existing) return apiError('not_found', 'Template not found', 404);

  if (parsed.data.fieldKey && parsed.data.fieldKey !== existing.fieldKey) {
    const duplicate = await db
      .select({ id: formFieldTemplates.id })
      .from(formFieldTemplates)
      .where(
        and(
          eq(formFieldTemplates.roleCategoryId, roleId),
          eq(formFieldTemplates.fieldKey, parsed.data.fieldKey),
        ),
      );
    if (duplicate.length > 0) {
      return apiError(
        'conflict',
        'A template with this field key already exists in this role',
        409,
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.fieldKey !== undefined) updateData.fieldKey = parsed.data.fieldKey;
  if (parsed.data.fieldValue !== undefined) {
    updateData.fieldValue = encryptField(parsed.data.fieldValue, userId);
  }

  if (Object.keys(updateData).length === 0) {
    return apiOk({ ...existing, fieldValue: safeDecryptField(existing.fieldValue, userId) });
  }

  const [updated] = await db
    .update(formFieldTemplates)
    .set(updateData)
    .where(
      and(
        eq(formFieldTemplates.id, templateId),
        eq(formFieldTemplates.roleCategoryId, roleId),
        eq(formFieldTemplates.userId, userId),
      ),
    )
    .returning();

  return apiOk({ ...updated, fieldValue: safeDecryptField(updated.fieldValue, userId) });
});

export const DELETE = withApiToken<Ctx>('write', async (_request, { params }, { userId }) => {
  const { roleId, templateId } = await params;

  const role = await assertRole(roleId, userId);
  if (!role) return apiError('not_found', 'Role not found', 404);

  const existing = await db.query.formFieldTemplates.findFirst({
    where: and(
      eq(formFieldTemplates.id, templateId),
      eq(formFieldTemplates.roleCategoryId, roleId),
      eq(formFieldTemplates.userId, userId),
    ),
  });
  if (!existing) return apiError('not_found', 'Template not found', 404);

  await db
    .delete(formFieldTemplates)
    .where(
      and(
        eq(formFieldTemplates.id, templateId),
        eq(formFieldTemplates.roleCategoryId, roleId),
        eq(formFieldTemplates.userId, userId),
      ),
    );

  return apiOk({ success: true });
});
