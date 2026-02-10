'use client';

import { useCallback, useState } from 'react';

import { RoleList } from '@/components/roles/role-list';
import { DeleteRoleDialog } from '@/components/roles/delete-role-dialog';

interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
}

interface RolesPageContentProps {
  initialRoles: Role[];
}

export function RolesPageContent({ initialRoles }: RolesPageContentProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [roles, setRoles] = useState(initialRoles);

  const handleDeleteRequest = useCallback((role: { id: string; name: string }) => {
    setDeleteTarget(role);
  }, []);

  const handleRolesChange = useCallback((newRoles: Role[]) => {
    setRoles(newRoles);
  }, []);

  const handleDeleted = useCallback(async () => {
    setDeleteTarget(null);
    const res = await fetch('/api/roles');
    if (res.ok) {
      setRoles(await res.json());
    }
  }, []);

  return (
    <>
      <RoleList
        roles={roles}
        onDeleteRequest={handleDeleteRequest}
        onRolesChange={handleRolesChange}
      />

      {deleteTarget && (
        <DeleteRoleDialog
          roleId={deleteTarget.id}
          roleName={deleteTarget.name}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
