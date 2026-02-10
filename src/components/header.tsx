'use client';

import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { UserMenu } from '@/components/user-menu';
import { Sidebar } from '@/components/sidebar';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  onSignOut?: () => void;
  className?: string;
}

export function Header({
  title,
  userName,
  userEmail,
  userImage,
  onSignOut,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'border-border bg-background flex h-14 items-center gap-4 border-b px-4',
        className
      )}
    >
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger
          className="text-muted-foreground hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="bg-sidebar border-border w-56 p-0"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      {title && (
        <h1 className="font-heading text-primary text-xl">{title}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationBell />
        <UserMenu
          name={userName}
          email={userEmail}
          image={userImage}
          onSignOut={onSignOut}
        />
      </div>
    </header>
  );
}
