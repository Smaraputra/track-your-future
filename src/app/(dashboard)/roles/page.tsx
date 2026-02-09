import { asc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories } from '@/db/schema/core';
import { RetroWindow } from '@/components/retro-window';
import { RolesPageContent } from '@/components/roles/roles-page-content';

export default async function RolesPage() {
  const session = await auth();

  const roles = await db
    .select()
    .from(roleCategories)
    .where(eq(roleCategories.userId, session!.user!.id))
    .orderBy(asc(roleCategories.position), asc(roleCategories.createdAt));

  const serializedRoles = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    position: r.position,
  }));

  return (
    <RetroWindow title="sys://roles">
      <RolesPageContent initialRoles={serializedRoles} />
    </RetroWindow>
  );
}
