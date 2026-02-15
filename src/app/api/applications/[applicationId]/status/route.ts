import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications, applicationStatusHistory } from '@/db/schema/applications';
import { updateStatusSchema } from '@/lib/applications/schemas';
import { detectMilestones } from '@/lib/notifications/milestones';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check ownership
  const existing = await db.query.applications.findFirst({
    where: and(
      eq(applications.id, applicationId),
      eq(applications.userId, session.user.id),
    ),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Idempotent: same status is a no-op
  if (existing.currentStatus === parsed.data.status) {
    return NextResponse.json(existing);
  }

  // Transaction: update status + insert history
  const [updated] = await db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = {
      currentStatus: parsed.data.status,
    };

    // Auto-set appliedAt on first non-draft transition
    if (existing.currentStatus === 'draft' && parsed.data.status !== 'draft' && !existing.appliedAt) {
      updateData.appliedAt = new Date();
    }

    const [app] = await tx
      .update(applications)
      .set(updateData)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, session.user.id)))
      .returning();

    await tx.insert(applicationStatusHistory).values({
      applicationId,
      fromStatus: existing.currentStatus,
      toStatus: parsed.data.status,
    });

    return [app];
  });

  // Fire-and-forget milestone detection
  detectMilestones(session.user.id, {
    event: 'status_changed',
    applicationId,
    newStatus: parsed.data.status,
  }).catch(() => {});

  return NextResponse.json(updated);
}
