import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories } from '@/db/schema/core';
import { reorderRolesSchema } from '@/lib/roles/schemas';

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = reorderRolesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { orderedIds } = parsed.data;

  // Verify all IDs belong to the user
  const userRoles = await db
    .select({ id: roleCategories.id })
    .from(roleCategories)
    .where(
      and(
        eq(roleCategories.userId, session.user.id),
        inArray(roleCategories.id, orderedIds),
      ),
    );

  if (userRoles.length !== orderedIds.length) {
    return NextResponse.json(
      { error: 'One or more role IDs are invalid' },
      { status: 400 },
    );
  }

  // Update positions in a transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(roleCategories)
        .set({ position: i })
        .where(
          and(
            eq(roleCategories.id, orderedIds[i]),
            eq(roleCategories.userId, session.user.id),
          ),
        );
    }
  });

  return NextResponse.json({ success: true });
}
