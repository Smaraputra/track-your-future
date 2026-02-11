'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { RetroButton } from '@/components/retro-button';

export function UpgradeCta() {
  return (
    <div className="border-primary/30 bg-primary/5 crt-screen border-glow rounded-md border p-4">
      <div className="flex items-start gap-3">
        <Zap className="text-primary mt-0.5 size-5 shrink-0" />
        <div className="space-y-2">
          <p className="font-heading text-primary text-shadow-glow text-sm">
            Upgrade to Pro
          </p>
          <p className="font-body text-muted-foreground text-xs">
            Unlimited applications, documents, and roles. Full AI suite including
            cover letters, interview prep, and resume suggestions.
          </p>
          <RetroButton asChild size="sm">
            <Link href="/pricing">View Plans</Link>
          </RetroButton>
        </div>
      </div>
    </div>
  );
}
