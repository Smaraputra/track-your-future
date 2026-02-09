import { RetroStatusBadge } from '@/components/retro-status-badge';

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
}

interface ApplicationStatusTimelineProps {
  history: StatusHistoryEntry[];
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ApplicationStatusTimeline({
  history,
}: ApplicationStatusTimelineProps) {
  if (history.length === 0) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        No status changes recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3">
          <div className="border-border mt-1 h-2 w-2 shrink-0 rounded-full border bg-current" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {entry.fromStatus && (
                <>
                  <RetroStatusBadge status={entry.fromStatus} />
                  <span className="font-body text-muted-foreground text-xs">
                    &rarr;
                  </span>
                </>
              )}
              <RetroStatusBadge status={entry.toStatus} />
            </div>
            <p className="font-body text-muted-foreground mt-0.5 text-xs">
              {formatTimestamp(entry.changedAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
