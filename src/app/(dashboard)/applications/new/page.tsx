import { asc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories } from '@/db/schema/core';
import { RetroWindow } from '@/components/retro-window';
import { ApplicationForm } from '@/components/applications/application-form';

export default async function NewApplicationPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const roles = await db
    .select({ id: roleCategories.id, name: roleCategories.name })
    .from(roleCategories)
    .where(eq(roleCategories.userId, userId))
    .orderBy(asc(roleCategories.name));

  return (
    <RetroWindow title="sys://applications/new">
      <ApplicationForm mode="create" roles={roles} />
    </RetroWindow>
  );
}
