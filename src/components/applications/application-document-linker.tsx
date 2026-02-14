'use client';

import { useState } from 'react';
import { Eye, FileText, Upload, X } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { RetroSelect } from '@/components/retro-select';
import { UploadDialog } from '@/components/documents/upload-dialog';
import { DocumentPreviewPanel } from './document-preview-panel';

interface LinkedDocument {
  id: string;
  fileName: string;
  documentType: string;
  customTypeName: string | null;
}

interface AvailableDocument {
  id: string;
  fileName: string;
  documentType: string;
}

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface ApplicationDocumentLinkerProps {
  applicationId: string;
  linkedDocuments: LinkedDocument[];
  availableDocuments: AvailableDocument[];
  onChanged: () => void;
  roles?: Role[];
}

export function ApplicationDocumentLinker({
  applicationId,
  linkedDocuments,
  availableDocuments,
  onChanged,
  roles,
}: ApplicationDocumentLinkerProps) {
  const [linking, setLinking] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const linkedIds = new Set(linkedDocuments.map((d) => d.id));
  const unlinkableDocuments = availableDocuments.filter(
    (d) => !linkedIds.has(d.id),
  );

  async function handleLink() {
    if (!selectedDocId) return;
    setLinking(true);

    const res = await fetch(`/api/applications/${applicationId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: selectedDocId }),
    });

    if (res.ok) {
      setSelectedDocId('');
      onChanged();
    }

    setLinking(false);
  }

  async function handleUnlink(documentId: string) {
    await fetch(
      `/api/applications/${applicationId}/documents?documentId=${documentId}`,
      { method: 'DELETE' },
    );
    onChanged();
  }

  async function handleUploaded(documentId?: string) {
    if (documentId) {
      await fetch(`/api/applications/${applicationId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
    }
    onChanged();
  }

  return (
    <div className="space-y-3">
      {linkedDocuments.length === 0 ? (
        <p className="font-body text-muted-foreground text-sm">
          No documents linked to this application.
        </p>
      ) : (
        <div className="space-y-2">
          {linkedDocuments.map((doc) => (
            <div
              key={doc.id}
              className="border-border flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="text-muted-foreground size-4 shrink-0" />
                <span className="font-body truncate text-sm">
                  {doc.fileName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <DocumentPreviewPanel
                  documentId={doc.id}
                  fileName={doc.fileName}
                  trigger={
                    <RetroButton
                      variant="ghost"
                      size="icon"
                      aria-label={`Preview ${doc.fileName}`}
                    >
                      <Eye className="size-4" />
                    </RetroButton>
                  }
                />
                <RetroButton
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUnlink(doc.id)}
                  aria-label={`Unlink ${doc.fileName}`}
                >
                  <X className="size-4" />
                </RetroButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {unlinkableDocuments.length > 0 && (
          <>
            <RetroSelect
              options={unlinkableDocuments.map((d) => ({
                value: d.id,
                label: d.fileName,
              }))}
              value={selectedDocId}
              onValueChange={setSelectedDocId}
              placeholder="Select document..."
              className="flex-1"
            />
            <RetroButton
              size="sm"
              onClick={handleLink}
              disabled={!selectedDocId || linking}
            >
              {linking ? 'Linking...' : 'Link'}
            </RetroButton>
          </>
        )}
        {roles && (
          <RetroButton
            variant="secondary"
            size="sm"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="size-4" />
            Upload
          </RetroButton>
        )}
      </div>

      {roles && (
        <UploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploaded={handleUploaded}
          roles={roles}
        />
      )}
    </div>
  );
}
