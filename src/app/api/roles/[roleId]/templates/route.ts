import { NextResponse } from 'next/server';
import { and, asc, count, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { formFieldTemplates, roleCategories } from '@/db/schema/core';
import { createTemplateSchema } from '@/lib/templates/schemas';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { encryptField, safeDecryptField } from '@/lib/crypto/field-encryption';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roleId } = await params;

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

  const templates = await db
    .select()
    .from(formFieldTemplates)
    .where(
      and(
        eq(formFieldTemplates.roleCategoryId, roleId),
        eq(formFieldTemplates.userId, session.user.id),
      ),
    )
    .orderBy(
      asc(formFieldTemplates.position),
      asc(formFieldTemplates.createdAt),
    );

  const decrypted = templates.map((t) => ({
    ...t,
    fieldValue: safeDecryptField(t.fieldValue, session.user.id),
  }));

  return NextResponse.json(decrypted);
}

export async function POST(
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

  const parsed = createTemplateSchema.safeParse(body);
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

  // Check global template limit
  const sub = await getUserSubscription(session.user.id);
  const limit = await checkResourceLimit(
    session.user.id,
    'formFieldTemplates',
    sub.tier,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Template limit reached (${limit.limit}). Upgrade to Pro for unlimited templates.`,
        limit: limit.limit,
        current: limit.current,
      },
      { status: 403 },
    );
  }

  // Check fieldKey uniqueness within role
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
    return NextResponse.json(
      { error: 'A template with this field key already exists in this role' },
      { status: 409 },
    );
  }

  // Get max position
  const [maxResult] = await db
    .select({ count: count() })
    .from(formFieldTemplates)
    .where(
      and(
        eq(formFieldTemplates.roleCategoryId, roleId),
        eq(formFieldTemplates.userId, session.user.id),
      ),
    );

  const encryptedValue = encryptField(parsed.data.fieldValue, session.user.id);

  const [template] = await db
    .insert(formFieldTemplates)
    .values({
      userId: session.user.id,
      roleCategoryId: roleId,
      fieldKey: parsed.data.fieldKey,
      fieldValue: encryptedValue,
      position: maxResult.count,
    })
    .returning();

  return NextResponse.json(
    { ...template, fieldValue: parsed.data.fieldValue },
    { status: 201 },
  );
}
