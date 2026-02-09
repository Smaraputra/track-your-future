'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { RetroDialog } from '@/components/retro-dialog';
import { RetroButton } from '@/components/retro-button';

interface DeleteApplicationDialogProps {
  applicationId: string;
  companyName: string;
  jobTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteApplicationDialog({
  applicationId,
  companyName,
  jobTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteApplicationDialogProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    const res = await fetch(`/api/applications/${applicationId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      onOpenChange(false);
      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/applications');
        router.refresh();
      }
    }

    setDeleting(false);
  }

  return (
    <RetroDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Application"
      description={`Are you sure you want to delete "${jobTitle}" at ${companyName}?`}
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
        This will permanently delete this application, its status history, and
        all document links. This action cannot be undone.
      </p>
    </RetroDialog>
  );
}
