'use client';

import { useState } from 'react';

import { RetroDialog } from '@/components/retro-dialog';
import { RetroButton } from '@/components/retro-button';

interface DeleteDocumentDialogProps {
  documentId: string;
  fileName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteDocumentDialog({
  documentId,
  fileName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteDocumentDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    const res = await fetch(`/api/documents/${documentId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      onOpenChange(false);
      onDeleted();
    }

    setDeleting(false);
  }

  return (
    <RetroDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Document"
      description={`Are you sure you want to delete "${fileName}"?`}
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
        This document and its file will be permanently deleted. This action
        cannot be undone.
      </p>
    </RetroDialog>
  );
}
