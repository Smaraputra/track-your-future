'use client';

import { useSyncExternalStore, useState } from 'react';
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

  // Track if we should animate - initialized once on client mount
  const [shouldAnimate] = useState(() => {
    // On server: no animation
    if (typeof window === 'undefined') return false;
    // On client: animate if boot hasn't been seen yet
    return !bootStore.getSnapshot();
  });

  const [mounted] = useState(() => typeof window !== 'undefined');

  // Hydration handling
  if (!mounted) {
    // Return with invisible class to match server HTML structure but hide content until client confirms state
    return (
      <header className={cn(className, 'invisible')} aria-hidden="true">
        {children}
      </header>
    );
  }

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
    >
      {children}
    </header>
  );
}