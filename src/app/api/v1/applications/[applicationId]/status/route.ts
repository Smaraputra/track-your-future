import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { applications, applicationStatusHistory } from '@/db/schema/applications';
import { updateStatusSchema } from '@/lib/applications/schemas';
import { detectMilestones } from '@/lib/notifications/milestones';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ applicationId: string }> };

export const PATCH = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { applicationId } = await params;

  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });
  if (!existing) return apiError('not_found', 'Application not found', 404);

  // Idempotent: same status is a no-op
  if (existing.currentStatus === parsed.data.status) return apiOk(existing);

  const [updated] = await db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = {
      currentStatus: parsed.data.status,
    };

    if (
      existing.currentStatus === 'draft' &&
      parsed.data.status !== 'draft' &&
      !existing.appliedAt
    ) {
      updateData.appliedAt = new Date();
    }

    const [app] = await tx
      .update(applications)
      .set(updateData)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
      .returning();

    await tx.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus: existing.currentStatus,
      toStatus: parsed.data.status,
    });

    return [app];
  });

  detectMilestones(userId, {
    event: 'status_changed',
    applicationId,
    newStatus: parsed.data.status,
  }).catch(() => {});

  return apiOk(updated);
});
