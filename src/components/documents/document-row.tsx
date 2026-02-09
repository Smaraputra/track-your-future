'use client';

import { Download, FileText, Trash2 } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { DocumentTypeBadge } from '@/components/documents/document-type-badge';
import { Badge } from '@/components/ui/badge';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 ? 1 : 0)} ${units[i]}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface DocumentItem {
  id: string;
  fileName: string;
  documentType: string;
  customTypeName: string | null;
  mimeType: string;
  fileSizeBytes: number;
  version: number;
  createdAt: string;
  roleCategoryId: string | null;
  roleCategoryName: string | null;
  roleCategoryColor: string | null;
}

interface DocumentRowProps {
  document: DocumentItem;
  onDownload: (id: string) => void;
  onDelete: (doc: DocumentItem) => void;
}

export function DocumentRow({ document, onDownload, onDelete }: DocumentRowProps) {
  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-3">
      <FileText className="text-muted-foreground size-5 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-body truncate text-sm font-medium">
            {document.fileName}
          </span>
          {document.version > 1 && (
            <span className="font-body text-muted-foreground text-xs">
              v{document.version}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <DocumentTypeBadge
            documentType={document.documentType}
            customTypeName={document.customTypeName}
          />
          {document.roleCategoryName && (
            <Badge
              variant="secondary"
              className="font-body text-xs"
              style={
                document.roleCategoryColor
                  ? { backgroundColor: `${document.roleCategoryColor}20`, color: document.roleCategoryColor }
                  : undefined
              }
            >
              {document.roleCategoryName}
            </Badge>
          )}
          <span className="font-body text-muted-foreground text-xs">
            {formatBytes(document.fileSizeBytes)}
          </span>
          <span className="font-body text-muted-foreground text-xs">
            {formatDate(document.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 gap-1">
        <RetroButton
          variant="ghost"
          size="icon"
          title="Download"
          onClick={() => onDownload(document.id)}
        >
          <Download className="size-4" />
        </RetroButton>
        <RetroButton
          variant="ghost"
          size="icon"
          title="Delete"
          onClick={() => onDelete(document)}
        >
          <Trash2 className="text-destructive size-4" />
        </RetroButton>
      </div>
    </div>
  );
}
