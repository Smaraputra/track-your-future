'use client';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(val < 10 ? 1 : 0)} ${units[i]}`;
}

interface StorageIndicatorProps {
  used: number;
  limit: number | null;
}

export function StorageIndicator({ used, limit }: StorageIndicatorProps) {
  const percentage = limit ? Math.min((used / limit) * 100, 100) : 0;
  const blockCount = 20;
  const filledBlocks = Math.round((percentage / 100) * blockCount);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-body text-muted-foreground text-xs">Storage</span>
        <span className="font-body text-muted-foreground text-xs">
          {formatBytes(used)}
          {limit !== null ? ` / ${formatBytes(limit)}` : ''}
        </span>
      </div>
      {limit !== null && (
        <div className="border-border bg-background h-3 overflow-hidden rounded border font-mono text-[10px]">
          <div
            className={`flex h-full items-center transition-[width] duration-200 ${
              percentage > 90 ? 'bg-destructive/80' : 'bg-primary/80'
            }`}
            style={{ width: `${percentage}%` }}
          >
            <span className="text-primary-foreground truncate px-0.5">
              {'#'.repeat(filledBlocks)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
