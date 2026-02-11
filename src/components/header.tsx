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
    <>
      <header
        className={cn(
          'border-border crt-screen flex h-14 items-center gap-4 border-b px-4 backdrop-blur-sm bg-background/80 shadow-[0_1px_0_rgba(var(--primary-rgb),0.15)]',
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

        {/* Terminal prompt */}
        <span className="font-body text-muted-foreground hidden text-xs lg:inline">
          user@tyf:~$<span className="cursor-terminal ml-1 inline-block w-0" aria-hidden="true">&nbsp;</span>
        </span>

        {/* Page title */}
        {title && (
          <h1 className="font-heading text-primary text-shadow-glow text-xl">{title}</h1>
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
      <div className="border-glow-sweep" aria-hidden="true" />
    </>
  );
}
