import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  applications,
  applicationStatusHistory,
  applicationDocuments,
} from '@/db/schema/applications';
import { roleCategories, documents } from '@/db/schema/core';
import { updateApplicationSchema } from '@/lib/applications/schemas';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  // Fetch application with role info
  const [app] = await db
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
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.userId, session.user.id),
      ),
    );

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Fetch status history
  const history = await db
    .select()
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(desc(applicationStatusHistory.changedAt));

  // Fetch linked documents
  const linkedDocs = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      documentType: documents.documentType,
      customTypeName: documents.customTypeName,
      mimeType: documents.mimeType,
      fileSizeBytes: documents.fileSizeBytes,
      createdAt: documents.createdAt,
    })
    .from(applicationDocuments)
    .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
    .where(eq(applicationDocuments.applicationId, applicationId));

  return NextResponse.json({
    ...app,
    statusHistory: history,
    linkedDocuments: linkedDocs,
  });
}

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

  const parsed = updateApplicationSchema.safeParse(body);
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

  // Verify role category ownership if being changed
  const roleCategoryId = parsed.data.roleCategoryId;
  if (roleCategoryId !== undefined) {
    const newRoleId = roleCategoryId || null;
    if (newRoleId) {
      const role = await db.query.roleCategories.findFirst({
        where: and(
          eq(roleCategories.id, newRoleId),
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
  }

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

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(existing);
  }

  const [updated] = await db
    .update(applications)
    .set(updateData)
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.userId, session.user.id),
      ),
    )
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

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

  await db
    .delete(applications)
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.userId, session.user.id),
      ),
    );

  return NextResponse.json({ success: true });
}
