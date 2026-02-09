'use client';

import type { UploadStatus } from '@/hooks/use-document-upload';

interface UploadProgressBarProps {
  progress: number;
  status: UploadStatus;
}

const STATUS_LABELS: Record<UploadStatus, string> = {
  idle: '',
  presigning: 'Preparing upload...',
  uploading: 'Uploading...',
  confirming: 'Confirming...',
  success: 'Upload complete',
  error: 'Upload failed',
};

export function UploadProgressBar({ progress, status }: UploadProgressBarProps) {
  if (status === 'idle') return null;

  const blockCount = 20;
  const filledBlocks = Math.round((progress / 100) * blockCount);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-body text-muted-foreground text-xs">
          {STATUS_LABELS[status]}
        </span>
        <span className="font-body text-muted-foreground text-xs">
          {progress}%
        </span>
      </div>
      <div className="border-border bg-background h-4 overflow-hidden rounded border font-mono text-xs">
        <div
          className="bg-primary/80 flex h-full items-center transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        >
          <span className="text-primary-foreground truncate px-1">
            {'#'.repeat(filledBlocks)}
          </span>
        </div>
      </div>
    </div>
  );
}
