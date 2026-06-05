import { and, asc, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { formFieldTemplates, roleCategories } from '@/db/schema/core';
import { createTemplateSchema } from '@/lib/templates/schemas';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { encryptField, safeDecryptField } from '@/lib/crypto/field-encryption';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ roleId: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { roleId } = await params;

  const role = await db.query.roleCategories.findFirst({
    where: and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)),
  });
  if (!role) return apiError('not_found', 'Role not found', 404);

  const templates = await db
    .select()
    .from(formFieldTemplates)
    .where(
      and(eq(formFieldTemplates.roleCategoryId, roleId), eq(formFieldTemplates.userId, userId)),
    )
    .orderBy(asc(formFieldTemplates.position), asc(formFieldTemplates.createdAt));

  const decrypted = templates.map((t) => ({
    ...t,
    fieldValue: safeDecryptField(t.fieldValue, userId),
  }));

  return apiOk(decrypted);
});

export const POST = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { roleId } = await params;

  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const role = await db.query.roleCategories.findFirst({
    where: and(eq(roleCategories.id, roleId), eq(roleCategories.userId, userId)),
  });
  if (!role) return apiError('not_found', 'Role not found', 404);

  const sub = await getUserSubscription(userId);
  const limit = await checkResourceLimit(userId, 'formFieldTemplates', sub.tier);
  if (!limit.allowed) {
    return apiError(
      'limit_reached',
      `Template limit reached (${limit.limit}). Upgrade to Pro for unlimited templates.`,
      403,
      { details: { limit: limit.limit, current: limit.current } },
    );
  }

  const existing = await db
    .select({ id: formFieldTemplates.id })
    .from(formFieldTemplates)
    .where(
      and(
        eq(formFieldTemplates.roleCategoryId, roleId),
        eq(formFieldTemplates.fieldKey, parsed.data.fieldKey),
      ),
    );
  if (existing.length > 0) {
    return apiError(
      'conflict',
      'A template with this field key already exists in this role',
      409,
    );
  }

  const [maxResult] = await db
    .select({ count: count() })
    .from(formFieldTemplates)
    .where(
      and(eq(formFieldTemplates.roleCategoryId, roleId), eq(formFieldTemplates.userId, userId)),
    );

  const [template] = await db
    .insert(formFieldTemplates)
    .values({
      userId,
      roleCategoryId: roleId,
      fieldKey: parsed.data.fieldKey,
      fieldValue: encryptField(parsed.data.fieldValue, userId),
      position: maxResult.count,
    })
    .returning();

  return apiOk({ ...template, fieldValue: parsed.data.fieldValue }, 201);
});
