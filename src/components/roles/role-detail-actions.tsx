'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { DeleteRoleDialog } from '@/components/roles/delete-role-dialog';

interface RoleDetailActionsProps {
  roleId: string;
  roleName: string;
}

export function RoleDetailActions({ roleId, roleName }: RoleDetailActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <RetroButton asChild variant="secondary" size="sm">
        <Link href={`/roles/${roleId}/edit`}>
          <Pencil className="size-4" />
          Edit
        </Link>
      </RetroButton>
      <RetroButton
        variant="destructive"
        size="sm"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4" />
        Delete
      </RetroButton>

      <DeleteRoleDialog
        roleId={roleId}
        roleName={roleName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
