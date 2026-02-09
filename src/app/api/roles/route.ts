import { NextResponse } from 'next/server';
import { and, asc, count, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories } from '@/db/schema/core';
import { createRoleSchema } from '@/lib/roles/schemas';
import { DEFAULT_ROLE_COLOR } from '@/lib/roles/constants';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roles = await db
    .select()
    .from(roleCategories)
    .where(eq(roleCategories.userId, session.user.id))
    .orderBy(asc(roleCategories.position), asc(roleCategories.createdAt));

  return NextResponse.json(roles);
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

  const parsed = createRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check resource limit
  const sub = await getUserSubscription(session.user.id);
  const limit = await checkResourceLimit(session.user.id, 'roleCategories', sub.tier);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Role category limit reached (${limit.limit}). Upgrade to Pro for unlimited roles.`,
        limit: limit.limit,
        current: limit.current,
      },
      { status: 403 },
    );
  }

  // Check name uniqueness
  const existing = await db
    .select({ id: roleCategories.id })
    .from(roleCategories)
    .where(
      and(
        eq(roleCategories.userId, session.user.id),
        eq(roleCategories.name, parsed.data.name),
      ),
    );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'A role category with this name already exists' },
      { status: 409 },
    );
  }

  // Get max position
  const [maxResult] = await db
    .select({ count: count() })
    .from(roleCategories)
    .where(eq(roleCategories.userId, session.user.id));

  const [role] = await db
    .insert(roleCategories)
    .values({
      userId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      color: parsed.data.color ?? DEFAULT_ROLE_COLOR,
      position: maxResult.count,
    })
    .returning();

  return NextResponse.json(role, { status: 201 });
}
