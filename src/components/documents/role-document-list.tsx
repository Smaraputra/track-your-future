'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import Link from 'next/link';

import { RetroButton } from '@/components/retro-button';
import { DocumentRow, type DocumentItem } from '@/components/documents/document-row';
import { DeleteDocumentDialog } from '@/components/documents/delete-document-dialog';
import { UploadDialog } from '@/components/documents/upload-dialog';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_LIMITS } from '@/lib/billing/plans';

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface RoleDocumentListProps {
  roleId: string;
  initialDocuments: DocumentItem[];
  roles: Role[];
  globalDocumentCount: number;
}

export function RoleDocumentList({
  roleId,
  initialDocuments,
  roles,
  globalDocumentCount,
}: RoleDocumentListProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [globalCount, setGlobalCount] = useState(globalDocumentCount);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const { tier } = useSubscription();
  const limit = PLAN_LIMITS[tier].resources.documents;

  const refreshDocuments = useCallback(async () => {
    const res = await fetch(`/api/documents?roleId=${roleId}`);
    if (res.ok) {
      const data = await res.json();
      setDocuments(data);
      setGlobalCount((prev) => prev + (data.length - documents.length));
    }
  }, [roleId, documents.length]);

  function handleDownload(id: string) {
    window.open(`/api/documents/${id}/download`, '_blank');
  }

  function handleUploaded() {
    setGlobalCount((prev) => prev + 1);
    refreshDocuments();
  }

  function handleDeleted() {
    setDeleteTarget(null);
    setGlobalCount((prev) => prev - 1);
    refreshDocuments();
  }

  const atLimit = limit !== null && globalCount >= limit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-muted-foreground text-sm">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
          {limit !== null ? ` (${globalCount} / ${limit} total)` : ''}
        </p>
        <RetroButton
          size="sm"
          disabled={atLimit}
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="size-4" />
          Upload
        </RetroButton>
      </div>

      {documents.length === 0 ? (
        <div className="border-border rounded-md border p-6 text-center">
          <FileText className="text-muted-foreground mx-auto size-6" />
          <p className="font-heading text-primary mt-2 text-base">
            No Documents
          </p>
          <p className="font-body text-muted-foreground mt-1 text-sm">
            Upload CVs and cover letters for this role.
          </p>
          <RetroButton
            size="sm"
            className="mt-3"
            disabled={atLimit}
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="size-4" />
            Upload Document
          </RetroButton>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onDownload={handleDownload}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {atLimit && tier === 'free' && (
        <p className="font-body text-muted-foreground text-center text-xs">
          Free plan document limit reached.{' '}
          <Link href="/pricing" className="text-primary hover:underline">
            Upgrade to Pro
          </Link>{' '}
          for unlimited documents.
        </p>
      )}

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={handleUploaded}
        roles={roles}
        defaultRoleId={roleId}
      />

      {deleteTarget && (
        <DeleteDocumentDialog
          documentId={deleteTarget.id}
          fileName={deleteTarget.fileName}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
