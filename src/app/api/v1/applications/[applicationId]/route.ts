import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  applications,
  applicationStatusHistory,
  applicationDocuments,
} from '@/db/schema/applications';
import { documents, roleCategories } from '@/db/schema/core';
import { updateApplicationSchema } from '@/lib/applications/schemas';
import { detectMilestones } from '@/lib/notifications/milestones';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ applicationId: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { applicationId } = await params;

  const application = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });

  if (!application) return apiError('not_found', 'Application not found', 404);

  const history = await db
    .select()
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(desc(applicationStatusHistory.changedAt));

  const linkedDocuments = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      documentType: documents.documentType,
      mimeType: documents.mimeType,
      fileSizeBytes: documents.fileSizeBytes,
      createdAt: documents.createdAt,
    })
    .from(applicationDocuments)
    .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
    .where(eq(applicationDocuments.applicationId, applicationId));

  return apiOk({ ...application, statusHistory: history, linkedDocuments });
});

export const PATCH = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { applicationId } = await params;

  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = updateApplicationSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });
  if (!existing) return apiError('not_found', 'Application not found', 404);

  const roleCategoryId = parsed.data.roleCategoryId;
  if (roleCategoryId !== undefined) {
    const newRoleId = roleCategoryId || null;
    if (newRoleId) {
      const role = await db.query.roleCategories.findFirst({
        where: and(eq(roleCategories.id, newRoleId), eq(roleCategories.userId, userId)),
      });
      if (!role) return apiError('not_found', 'Role category not found', 404);
    }
  }

  // null when status is unchanged; lets TypeScript narrow to the enum in the
  // change branches below.
  const nextStatus =
    parsed.data.currentStatus !== undefined &&
    parsed.data.currentStatus !== existing.currentStatus
      ? parsed.data.currentStatus
      : null;

  const updateData: Record<string, unknown> = {};
  if (parsed.data.companyName !== undefined) updateData.companyName = parsed.data.companyName;
  if (parsed.data.jobTitle !== undefined) updateData.jobTitle = parsed.data.jobTitle;
  if (parsed.data.jobUrl !== undefined) updateData.jobUrl = parsed.data.jobUrl || null;
  if (parsed.data.roleCategoryId !== undefined) {
    updateData.roleCategoryId = parsed.data.roleCategoryId || null;
  }
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes || null;
  if (parsed.data.appliedAt !== undefined) {
    updateData.appliedAt = parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : null;
  }
  if (nextStatus !== null) updateData.currentStatus = nextStatus;

  if (Object.keys(updateData).length === 0) return apiOk(existing);

  // Record the transition atomically when the status changes (mirrors the
  // dedicated PATCH .../status route).
  const [updated] =
    nextStatus !== null
      ? await db.transaction(async (tx) => {
          const rows = await tx
            .update(applications)
            .set(updateData)
            .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
            .returning();

          await tx.insert(applicationStatusHistory).values({
            applicationId,
            fromStatus: existing.currentStatus,
            toStatus: nextStatus,
          });

          return rows;
        })
      : await db
          .update(applications)
          .set(updateData)
          .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)))
          .returning();

  if (nextStatus !== null) {
    detectMilestones(userId, {
      event: 'status_changed',
      applicationId,
      newStatus: nextStatus,
    }).catch(() => {});
  }

  return apiOk(updated);
});

export const DELETE = withApiToken<Ctx>('write', async (_request, { params }, { userId }) => {
  const { applicationId } = await params;

  const existing = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });
  if (!existing) return apiError('not_found', 'Application not found', 404);

  await db
    .delete(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));

  return apiOk({ success: true });
});
