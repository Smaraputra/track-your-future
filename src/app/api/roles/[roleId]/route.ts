import { NextResponse } from 'next/server';
import { and, count, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories, documents, formFieldTemplates } from '@/db/schema/core';
import { applications } from '@/db/schema/applications';
import { updateRoleSchema } from '@/lib/roles/schemas';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId } = await params;

  const role = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session.user.id),
    ),
  });

  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  // Get relation counts
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

  return NextResponse.json({
    ...role,
    _counts: {
      documents: docCount.count,
      applications: appCount.count,
      formFieldTemplates: templateCount.count,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check ownership
  const existing = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session.user.id),
    ),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  // Check name uniqueness if name is being changed
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await db
      .select({ id: roleCategories.id })
      .from(roleCategories)
      .where(
        and(
          eq(roleCategories.userId, session.user.id),
          eq(roleCategories.name, parsed.data.name),
        ),
      );

    if (duplicate.length > 0) {
      return NextResponse.json(
        { error: 'A role category with this name already exists' },
        { status: 409 },
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) {
    updateData.description = parsed.data.description || null;
  }
  if (parsed.data.color !== undefined) updateData.color = parsed.data.color;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(existing);
  }

  const [updated] = await db
    .update(roleCategories)
    .set(updateData)
    .where(
      and(
        eq(roleCategories.id, roleId),
        eq(roleCategories.userId, session.user.id),
      ),
    )
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId } = await params;

  // Check ownership
  const existing = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session.user.id),
    ),
  });

  if (!existing) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  await db
    .delete(roleCategories)
    .where(
      and(
        eq(roleCategories.id, roleId),
        eq(roleCategories.userId, session.user.id),
      ),
    );

  return NextResponse.json({ success: true });
}
