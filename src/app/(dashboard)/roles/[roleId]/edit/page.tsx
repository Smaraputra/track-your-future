import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories } from '@/db/schema/core';
import { RetroWindow } from '@/components/retro-window';
import { RoleForm } from '@/components/roles/role-form';

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const session = await auth();
  const { roleId } = await params;

  const role = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session!.user!.id),
    ),
  });

  if (!role) {
    notFound();
  }

  return (
    <RetroWindow title={`sys://roles/${role.name}/edit`}>
      <RoleForm
        mode="edit"
        roleId={role.id}
        defaultValues={{
          name: role.name,
          description: role.description ?? '',
          color: role.color ?? undefined,
        }}
      />
    </RetroWindow>
  );
}
