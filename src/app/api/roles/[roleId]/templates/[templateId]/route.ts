import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { formFieldTemplates, roleCategories } from '@/db/schema/core';
import { updateTemplateSchema } from '@/lib/templates/schemas';
import { encryptField, safeDecryptField } from '@/lib/crypto/field-encryption';

type Params = { params: Promise<{ roleId: string; templateId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId, templateId } = await params;

  // Verify role ownership
  const role = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session.user.id),
    ),
  });

  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const template = await db.query.formFieldTemplates.findFirst({
    where: and(
      eq(formFieldTemplates.id, templateId),
      eq(formFieldTemplates.roleCategoryId, roleId),
      eq(formFieldTemplates.userId, session.user.id),
    ),
  });

  if (!template) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...template,
    fieldValue: safeDecryptField(template.fieldValue, session.user.id),
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId, templateId } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Verify role ownership
  const role = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session.user.id),
    ),
  });

  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  // Check template exists and belongs to user
  const existing = await db.query.formFieldTemplates.findFirst({
    where: and(
      eq(formFieldTemplates.id, templateId),
      eq(formFieldTemplates.roleCategoryId, roleId),
      eq(formFieldTemplates.userId, session.user.id),
    ),
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 },
    );
  }

  // Check fieldKey uniqueness if key is being changed
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
      return NextResponse.json(
        {
          error:
            'A template with this field key already exists in this role',
        },
        { status: 409 },
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.fieldKey !== undefined)
    updateData.fieldKey = parsed.data.fieldKey;
  if (parsed.data.fieldValue !== undefined)
    updateData.fieldValue = encryptField(parsed.data.fieldValue, session.user.id);

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({
      ...existing,
      fieldValue: safeDecryptField(existing.fieldValue, session.user.id),
    });
  }

  const [updated] = await db
    .update(formFieldTemplates)
    .set(updateData)
    .where(
      and(
        eq(formFieldTemplates.id, templateId),
        eq(formFieldTemplates.roleCategoryId, roleId),
        eq(formFieldTemplates.userId, session.user.id),
      ),
    )
    .returning();

  return NextResponse.json({
    ...updated,
    fieldValue: safeDecryptField(updated.fieldValue, session.user.id),
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId, templateId } = await params;

  // Verify role ownership
  const role = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session.user.id),
    ),
  });

  if (!role) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  const existing = await db.query.formFieldTemplates.findFirst({
    where: and(
      eq(formFieldTemplates.id, templateId),
      eq(formFieldTemplates.roleCategoryId, roleId),
      eq(formFieldTemplates.userId, session.user.id),
    ),
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Template not found' },
      { status: 404 },
    );
  }

  await db
    .delete(formFieldTemplates)
    .where(
      and(
        eq(formFieldTemplates.id, templateId),
        eq(formFieldTemplates.roleCategoryId, roleId),
        eq(formFieldTemplates.userId, session.user.id),
      ),
    );

  return NextResponse.json({ success: true });
}
