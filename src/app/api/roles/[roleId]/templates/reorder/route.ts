import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { formFieldTemplates, roleCategories } from '@/db/schema/core';
import { reorderTemplatesSchema } from '@/lib/templates/schemas';

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

  const parsed = reorderTemplatesSchema.safeParse(body);
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

  const { orderedIds } = parsed.data;

  // Verify all IDs belong to the user and role
  const userTemplates = await db
    .select({ id: formFieldTemplates.id })
    .from(formFieldTemplates)
    .where(
      and(
        eq(formFieldTemplates.userId, session.user.id),
        eq(formFieldTemplates.roleCategoryId, roleId),
        inArray(formFieldTemplates.id, orderedIds),
      ),
    );

  if (userTemplates.length !== orderedIds.length) {
    return NextResponse.json(
      { error: 'One or more template IDs are invalid' },
      { status: 400 },
    );
  }

  // Update positions in a transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(formFieldTemplates)
        .set({ position: i })
        .where(
          and(
            eq(formFieldTemplates.id, orderedIds[i]),
            eq(formFieldTemplates.userId, session.user.id),
            eq(formFieldTemplates.roleCategoryId, roleId),
          ),
        );
    }
  });

  return NextResponse.json({ success: true });
}
