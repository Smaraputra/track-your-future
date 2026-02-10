'use client';

import Link from 'next/link';
import { AlertTriangle, Trophy, Bell, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  applicationId: string | null;
  createdAt: string;
  onMarkRead: (id: string) => void;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  stale_app: AlertTriangle,
  milestone: Trophy,
  follow_up: Calendar,
  weekly_summary: Bell,
};

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationItem({
  id,
  type,
  title,
  body,
  isRead,
  applicationId,
  createdAt,
  onMarkRead,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[type] ?? Bell;

  const content = (
    <div
      className={cn(
        'flex gap-3 p-3 transition-colors',
        !isRead && 'bg-primary/5',
        applicationId && 'hover:bg-accent/50 cursor-pointer',
      )}
      onClick={() => {
        if (!isRead) onMarkRead(id);
      }}
    >
      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={cn(
          'font-body text-sm',
          !isRead ? 'text-foreground font-medium' : 'text-muted-foreground',
        )}>
          {title}
        </p>
        {body && (
          <p className="font-body text-muted-foreground mt-0.5 text-xs line-clamp-2">
            {body}
          </p>
        )}
        <p className="font-body text-muted-foreground mt-1 text-xs">
          {formatRelativeTime(createdAt)}
        </p>
      </div>
      {!isRead && (
        <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
      )}
    </div>
  );

  if (applicationId) {
    return (
      <Link href={`/applications/${applicationId}`}>
        {content}
      </Link>
    );
  }

  return content;
}
