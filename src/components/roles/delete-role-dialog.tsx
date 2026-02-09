'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { RetroDialog } from '@/components/retro-dialog';
import { RetroButton } from '@/components/retro-button';

interface DeleteRoleDialogProps {
  roleId: string;
  roleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteRoleDialog({
  roleId,
  roleName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteRoleDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    const res = await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });

    if (res.ok) {
      onOpenChange(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/roles');
        router.refresh();
      }
    }

    setDeleting(false);
  }

  return (
    <RetroDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Role Category"
      description={`Are you sure you want to delete "${roleName}"?`}
      footer={
        <div className="flex gap-2">
          <RetroButton
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </RetroButton>
          <RetroButton
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </RetroButton>
        </div>
      }
    >
      <p className="font-body text-muted-foreground text-sm">
        This will unlink all associated documents and applications from this
        role category. Form field templates will be permanently deleted.
        This action cannot be undone.
      </p>
    </RetroDialog>
  );
}
