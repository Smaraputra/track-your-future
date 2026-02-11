'use client';

import { signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { UserMenu } from '@/components/user-menu';

interface DockStatusBarProps {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function DockStatusBar({
  userName,
  userEmail,
  userImage,
}: DockStatusBarProps) {
  return (
    <>
      <header
        className="relative z-50 flex h-12 items-center gap-3 border-b border-border px-4 backdrop-blur-sm bg-background/80"
        data-testid="dock-status-bar"
      >
        <span className="font-body text-muted-foreground hidden text-xs lg:inline">
          user@tyf:~$
          <span
            className="cursor-terminal ml-1 inline-block w-0"
            aria-hidden="true"
          >
            &nbsp;
          </span>
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <UserMenu
            name={userName}
            email={userEmail}
            image={userImage}
            onSignOut={() => signOut({ redirectTo: '/' })}
          />
        </div>
      </header>
      <div className="border-glow-sweep" aria-hidden="true" />
    </>
  );
}
