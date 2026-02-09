'use client';

import { useCallback, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import Link from 'next/link';

import { RetroButton } from '@/components/retro-button';
import { DocumentRow, type DocumentItem } from '@/components/documents/document-row';
import { DeleteDocumentDialog } from '@/components/documents/delete-document-dialog';
import { UploadDialog } from '@/components/documents/upload-dialog';
import { StorageIndicator } from '@/components/documents/storage-indicator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubscription } from '@/hooks/use-subscription';

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface DocumentsPageContentProps {
  initialDocuments: DocumentItem[];
  roles: Role[];
  documentCount: number;
  documentLimit: number | null;
  storageUsed: number;
  storageLimit: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  cv: 'CV',
  cover_letter: 'Cover Letter',
  summary: 'Summary',
  custom: 'Custom',
};

export function DocumentsPageContent({
  initialDocuments,
  roles,
  documentCount: initialDocCount,
  documentLimit,
  storageUsed: initialStorageUsed,
  storageLimit,
}: DocumentsPageContentProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [docCount, setDocCount] = useState(initialDocCount);
  const [storageUsed, setStorageUsed] = useState(initialStorageUsed);
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const { tier } = useSubscription();

  const refreshDocuments = useCallback(async () => {
    const res = await fetch('/api/documents');
    if (res.ok) {
      const data = await res.json();
      setDocuments(data);
      setDocCount(data.length);
      const totalSize = data.reduce(
        (sum: number, d: DocumentItem) => sum + d.fileSizeBytes,
        0,
      );
      setStorageUsed(totalSize);
    }
  }, []);

  function handleDownload(id: string) {
    window.open(`/api/documents/${id}/download`, '_blank');
  }

  function handleUploaded() {
    refreshDocuments();
  }

  function handleParsed() {
    refreshDocuments();
  }

  function handleDeleted() {
    setDeleteTarget(null);
    refreshDocuments();
  }

  const filteredDocuments = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.documentType !== typeFilter) return false;
    if (roleFilter !== 'all') {
      if (roleFilter === 'none' && doc.roleCategoryId !== null) return false;
      if (roleFilter !== 'none' && doc.roleCategoryId !== roleFilter) return false;
    }
    return true;
  });

  const atLimit = documentLimit !== null && docCount >= documentLimit;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-body text-muted-foreground text-sm">
            {docCount} document{docCount !== 1 ? 's' : ''}
            {documentLimit !== null ? ` / ${documentLimit}` : ''}
          </p>
          <StorageIndicator used={storageUsed} limit={storageLimit} />
        </div>
        <RetroButton
          size="sm"
          disabled={atLimit}
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="size-4" />
          Upload
        </RetroButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]" size="sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="none">No Role</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="border-border rounded-md border p-8 text-center">
          <FileText className="text-muted-foreground mx-auto size-8" />
          <p className="font-heading text-primary mt-2 text-lg">
            {documents.length === 0 ? 'No Documents Yet' : 'No Matching Documents'}
          </p>
          <p className="font-body text-muted-foreground mt-1 text-sm">
            {documents.length === 0
              ? 'Upload CVs, cover letters, and other documents to get started.'
              : 'Try adjusting your filters.'}
          </p>
          {documents.length === 0 && (
            <RetroButton
              size="sm"
              className="mt-4"
              disabled={atLimit}
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="size-4" />
              Upload Your First Document
            </RetroButton>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              onDownload={handleDownload}
              onDelete={setDeleteTarget}
              onParse={handleParsed}
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
