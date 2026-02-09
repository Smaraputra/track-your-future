'use client';

import { useState } from 'react';
import { FileText, X } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { RetroSelect } from '@/components/retro-select';

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

interface ApplicationDocumentLinkerProps {
  applicationId: string;
  linkedDocuments: LinkedDocument[];
  availableDocuments: AvailableDocument[];
  onChanged: () => void;
}

export function ApplicationDocumentLinker({
  applicationId,
  linkedDocuments,
  availableDocuments,
  onChanged,
}: ApplicationDocumentLinkerProps) {
  const [linking, setLinking] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');

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
              <RetroButton
                variant="ghost"
                size="icon"
                onClick={() => handleUnlink(doc.id)}
                aria-label={`Unlink ${doc.fileName}`}
              >
                <X className="size-4" />
              </RetroButton>
            </div>
          ))}
        </div>
      )}

      {unlinkableDocuments.length > 0 && (
        <div className="flex items-center gap-2">
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
        </div>
      )}
    </div>
  );
}
