'use client';

import { RetroButton } from '@/components/retro-button';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
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
  );
}
