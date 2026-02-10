'use client';

import { useCallback, useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationDropdown } from './notification-dropdown';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  applicationId: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  initialUnreadCount?: number;
}

export function NotificationBell({ initialUnreadCount = 0 }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/notifications/unread-count'),
      ]);
      if (notifRes.ok) {
        setNotifications(await notifRes.json());
      }
      if (countRes.ok) {
        const data = await countRes.json();
        setUnreadCount(data.count);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return (
    <div className="relative">
      <button
        className="text-muted-foreground hover:text-foreground relative transition-colors"
        aria-label="Notifications"
        onClick={open ? handleClose : handleOpen}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="bg-primary absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
