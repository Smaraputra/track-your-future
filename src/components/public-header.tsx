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

  return (
    <header
      className={cn(
        className,
        !seen && 'hidden',
        shouldAnimate && 'animate-slide-in-from-top'
      )}
      suppressHydrationWarning
    >
      {children}
    </header>
  );
}