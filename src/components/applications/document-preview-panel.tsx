'use client';

import { useCallback, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { RetroDialog } from '@/components/retro-dialog';
import { RetroButton } from '@/components/retro-button';

interface DocumentPreviewPanelProps {
  documentId: string;
  fileName: string;
  trigger: React.ReactNode;
}

interface PreviewData {
  url: string;
  mimeType: string;
  fileName: string;
}

export function DocumentPreviewPanel({
  documentId,
  fileName,
  trigger,
}: DocumentPreviewPanelProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (newOpen && !preview) {
        setLoading(true);
        setError(null);
        fetch(`/api/documents/${documentId}/preview`)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to load preview');
            return res.json();
          })
          .then((data: PreviewData) => {
            setPreview(data);
            setLoading(false);
          })
          .catch((e: Error) => {
            setError(e.message);
            setLoading(false);
          });
      }
    },
    [documentId, preview],
  );

  const isPdf = preview?.mimeType === 'application/pdf';

  return (
    <RetroDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={fileName}
      description="Document preview"
      className="max-h-[85vh] max-w-3xl overflow-y-auto"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}
      {error && (
        <p className="font-body text-destructive text-sm">{error}</p>
      )}
      {preview && (
        <div className="space-y-3">
          {isPdf ? (
            <object
              data={preview.url}
              type="application/pdf"
              className="h-[60vh] w-full rounded-md border"
            >
              <p className="font-body text-muted-foreground p-4 text-sm">
                PDF preview not available in your browser.{' '}
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Open in new tab
                </a>
              </p>
            </object>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <p className="font-body text-muted-foreground text-sm">
                Preview not available for this file type.
              </p>
              <RetroButton variant="secondary" size="sm" asChild>
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in new tab
                </a>
              </RetroButton>
            </div>
          )}
        </div>
      )}
    </RetroDialog>
  );
}
