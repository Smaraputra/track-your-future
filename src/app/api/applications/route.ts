import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { roleCategories } from '@/db/schema/core';
import { applicationStatusEnum } from '@/db/schema/enums';
import { createApplicationSchema } from '@/lib/applications/schemas';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { detectMilestones } from '@/lib/notifications/milestones';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const roleFilter = searchParams.get('roleId');

  const conditions = [eq(applications.userId, session.user.id)];

  if (statusFilter) {
    if (!applicationStatusEnum.enumValues.includes(statusFilter as typeof applicationStatusEnum.enumValues[number])) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }
    conditions.push(eq(applications.currentStatus, statusFilter as typeof applicationStatusEnum.enumValues[number]));
  }

  if (roleFilter) {
    conditions.push(eq(applications.roleCategoryId, roleFilter));
  }

  const rows = await db
    .select({
      id: applications.id,
      userId: applications.userId,
      roleCategoryId: applications.roleCategoryId,
      companyName: applications.companyName,
      jobTitle: applications.jobTitle,
      jobUrl: applications.jobUrl,
      currentStatus: applications.currentStatus,
      appliedAt: applications.appliedAt,
      notes: applications.notes,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      roleCategoryName: roleCategories.name,
      roleCategoryColor: roleCategories.color,
    })
    .from(applications)
    .leftJoin(roleCategories, eq(applications.roleCategoryId, roleCategories.id))
    .where(and(...conditions))
    .orderBy(desc(applications.updatedAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check resource limit
  const sub = await getUserSubscription(session.user.id);
  const limit = await checkResourceLimit(session.user.id, 'applications', sub.tier);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Application limit reached (${limit.limit}). Upgrade to Pro for unlimited applications.`,
        limit: limit.limit,
        current: limit.current,
      },
      { status: 403 },
    );
  }

  // Verify role category ownership if provided
  const roleCategoryId = parsed.data.roleCategoryId || null;
  if (roleCategoryId) {
    const role = await db.query.roleCategories.findFirst({
      where: and(
        eq(roleCategories.id, roleCategoryId),
        eq(roleCategories.userId, session.user.id),
      ),
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role category not found' },
        { status: 404 },
      );
    }
  }

  const status = parsed.data.currentStatus ?? 'draft';
  const appliedAt = parsed.data.appliedAt
    ? new Date(parsed.data.appliedAt)
    : status !== 'draft'
      ? new Date()
      : null;

  const [application] = await db
    .insert(applications)
    .values({
      userId: session.user.id,
      companyName: parsed.data.companyName,
      jobTitle: parsed.data.jobTitle,
      jobUrl: parsed.data.jobUrl || null,
      roleCategoryId,
      currentStatus: status,
      appliedAt,
      notes: parsed.data.notes || null,
    })
    .returning();

  // Fire-and-forget milestone detection
  detectMilestones(session.user.id, {
    event: 'app_created',
    applicationId: application.id,
  }).catch(() => {});

  return NextResponse.json(application, { status: 201 });
}
