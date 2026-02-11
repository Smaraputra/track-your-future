'use client';

import Link from 'next/link';

interface ActivityItem {
  id: string;
  applicationId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  companyName: string;
  jobTitle: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        No recent activity. Status changes will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/applications/${item.applicationId}`}
            className="hover:bg-accent/50 border-glow flex items-baseline gap-2 rounded px-2 py-1.5 transition-colors"
          >
            <span className="text-muted-foreground font-body shrink-0 text-xs">
              {formatRelativeTime(item.changedAt)}
            </span>
            <span className="font-body text-foreground text-sm">
              <span className="text-primary text-phosphor font-medium">{item.companyName}</span>
              {item.fromStatus ? (
                <>
                  {' '}
                  {formatStatus(item.fromStatus)}{' '}
                  <span className="text-muted-foreground">-&gt;</span>{' '}
                  {formatStatus(item.toStatus)}
                </>
              ) : (
                <> set to {formatStatus(item.toStatus)}</>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
