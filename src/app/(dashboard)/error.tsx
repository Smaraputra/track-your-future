'use client';

import { RetroWindow } from '@/components/retro-window';
import { RetroButton } from '@/components/retro-button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RetroWindow title="sys://error">
      <div className="space-y-4 text-center">
        <h2 className="font-heading text-destructive text-lg">SYSTEM ERROR</h2>
        <p className="font-body text-muted-foreground text-sm">
          {error.message || 'An unexpected error occurred'}
        </p>
        {error.digest && (
          <p className="font-body text-muted-foreground text-xs">
            Error ID: {error.digest}
          </p>
        )}
        <RetroButton onClick={reset}>Retry</RetroButton>
      </div>
    </RetroWindow>
  );
}
