import { and, asc, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { roleCategories } from '@/db/schema/core';
import { createRoleSchema } from '@/lib/roles/schemas';
import { DEFAULT_ROLE_COLOR } from '@/lib/roles/constants';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

export const GET = withApiToken('read', async (_request, _ctx, { userId }) => {
  const roles = await db
    .select()
    .from(roleCategories)
    .where(eq(roleCategories.userId, userId))
    .orderBy(asc(roleCategories.position), asc(roleCategories.createdAt));

  return apiOk(roles);
});

export const POST = withApiToken('write', async (request, _ctx, { userId }) => {
  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = createRoleSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const sub = await getUserSubscription(userId);
  const limit = await checkResourceLimit(userId, 'roleCategories', sub.tier);
  if (!limit.allowed) {
    return apiError(
      'limit_reached',
      `Role category limit reached (${limit.limit}). Upgrade to Pro for unlimited roles.`,
      403,
      { details: { limit: limit.limit, current: limit.current } },
    );
  }

  const existing = await db
    .select({ id: roleCategories.id })
    .from(roleCategories)
    .where(and(eq(roleCategories.userId, userId), eq(roleCategories.name, parsed.data.name)));

  if (existing.length > 0) {
    return apiError('conflict', 'A role category with this name already exists', 409);
  }

  const [maxResult] = await db
    .select({ count: count() })
    .from(roleCategories)
    .where(eq(roleCategories.userId, userId));

  const [role] = await db
    .insert(roleCategories)
    .values({
      userId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color ?? DEFAULT_ROLE_COLOR,
      position: maxResult.count,
    })
    .returning();

  return apiOk(role, 201);
});
