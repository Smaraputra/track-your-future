import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { applications, applicationStatusHistory } from '@/db/schema/applications';
import { roleCategories } from '@/db/schema/core';
import { applicationStatusEnum } from '@/db/schema/enums';
import { createApplicationSchema } from '@/lib/applications/schemas';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { detectMilestones } from '@/lib/notifications/milestones';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type AppStatus = (typeof applicationStatusEnum.enumValues)[number];

export const GET = withApiToken('read', async (request, _ctx, { userId }) => {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const roleFilter = searchParams.get('roleId');

  const conditions = [eq(applications.userId, userId)];

  if (statusFilter) {
    if (!applicationStatusEnum.enumValues.includes(statusFilter as AppStatus)) {
      return apiError('invalid_filter', 'Invalid status filter', 400);
    }
    conditions.push(eq(applications.currentStatus, statusFilter as AppStatus));
  }

  if (roleFilter) {
    conditions.push(eq(applications.roleCategoryId, roleFilter));
  }

  const rows = await db
    .select()
    .from(applications)
    .where(and(...conditions))
    .orderBy(desc(applications.updatedAt));

  return apiOk(rows);
});

export const POST = withApiToken('write', async (request, _ctx, { userId }) => {
  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const sub = await getUserSubscription(userId);
  const limit = await checkResourceLimit(userId, 'applications', sub.tier);
  if (!limit.allowed) {
    return apiError(
      'limit_reached',
      `Application limit reached (${limit.limit}). Upgrade to Pro for unlimited applications.`,
      403,
      { details: { limit: limit.limit, current: limit.current } },
    );
  }

  const roleCategoryId = parsed.data.roleCategoryId || null;
  if (roleCategoryId) {
    const role = await db.query.roleCategories.findFirst({
      where: and(eq(roleCategories.id, roleCategoryId), eq(roleCategories.userId, userId)),
    });
    if (!role) return apiError('not_found', 'Role category not found', 404);
  }

  const status = parsed.data.currentStatus ?? 'draft';
  const appliedAt = parsed.data.appliedAt
    ? new Date(parsed.data.appliedAt)
    : status !== 'draft'
      ? new Date()
      : null;

  const insertValues = {
    userId,
    companyName: parsed.data.companyName,
    jobTitle: parsed.data.jobTitle,
    jobUrl: parsed.data.jobUrl || null,
    roleCategoryId,
    currentStatus: status,
    appliedAt,
    notes: parsed.data.notes || null,
  };

  // Record the implicit draft -> status transition for non-draft creations so
  // the analytics funnel and timeline stay accurate (mirrors PATCH .../status).
  const [application] =
    status !== 'draft'
      ? await db.transaction(async (tx) => {
          const [app] = await tx.insert(applications).values(insertValues).returning();
          await tx.insert(applicationStatusHistory).values({
            applicationId: app.id,
            fromStatus: 'draft',
            toStatus: status,
          });
          return [app];
        })
      : await db.insert(applications).values(insertValues).returning();

  detectMilestones(userId, {
    event: 'app_created',
    applicationId: application.id,
  }).catch(() => {});

  return apiOk(application, 201);
});
