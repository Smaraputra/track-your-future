'use client';

import { useSyncExternalStore } from 'react';
import { bootStore } from '@/lib/boot-store';
import { cn } from '@/lib/utils';

interface PublicHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PublicHeader({ children, className }: PublicHeaderProps) {
  const seen = useSyncExternalStore(
    bootStore.subscribe,
    bootStore.getSnapshot,
    bootStore.getServerSnapshot
  );

  // Determine if we should animate based on initial boot state
  // This is safe because it's evaluated once on mount
  const shouldAnimate = typeof window !== 'undefined' && !bootStore.getSnapshot();

  // If boot not completed yet, hide navbar
  if (!seen) {
    return null;
  }

  return (
    <header
      className={cn(
        className,
        shouldAnimate && 'animate-slide-in-from-top'
      )}
      suppressHydrationWarning
    >
      {children}
    </header>
  );
}