'use client';

import { useEffect, useRef } from 'react';
import { NotificationItem } from './notification-item';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  applicationId: string | null;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div
      ref={ref}
      className="border-border bg-surface absolute right-0 top-full z-50 mt-2 w-80 rounded-md border shadow-lg"
    >
      <div className="border-border flex items-center justify-between border-b px-3 py-2">
        <h3 className="font-heading text-primary text-sm">Notifications</h3>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="font-body text-primary text-xs hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="font-body text-muted-foreground p-4 text-center text-sm">
            No notifications yet.
          </p>
        ) : (
          <div className="divide-border divide-y">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                {...n}
                onMarkRead={onMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
