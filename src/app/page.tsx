'use client';

import { RetroWindow } from '@/components/retro-window';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroStatusBadge } from '@/components/retro-status-badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { UpgradeGate } from '@/components/upgrade-gate';
import { CRTOverlay, useCRTOverlay } from '@/components/crt-overlay';

const STATUSES = [
  'draft',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'ghosted',
  'withdrawn',
] as const;

export default function Home() {
  const crt = useCRTOverlay();

  return (
    <div className="min-h-screen bg-background p-8">
      <CRTOverlay />

      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-2">
          <h1 className="font-heading text-primary text-shadow-glow text-4xl">
            Track Your Future
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Component showcase -- Phase 4 Design System
          </p>
        </header>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={crt.toggle}
            className="text-muted-foreground hover:text-foreground font-body text-xs transition-colors"
          >
            CRT: [{crt.enabled ? 'ON' : 'OFF'}]
          </button>
        </div>

        {/* RetroWindow */}
        <RetroWindow title="retro-window.tsx">
          <p className="text-foreground text-sm">
            Terminal-style window frame with title bar and colored dots.
          </p>
        </RetroWindow>

        {/* Buttons */}
        <RetroWindow title="retro-button.tsx">
          <div className="flex flex-wrap gap-3">
            <RetroButton variant="primary">Primary</RetroButton>
            <RetroButton variant="secondary">Secondary</RetroButton>
            <RetroButton variant="ghost">Ghost</RetroButton>
            <RetroButton variant="destructive">Destructive</RetroButton>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <RetroButton size="sm">Small</RetroButton>
            <RetroButton size="default">Default</RetroButton>
            <RetroButton size="lg">Large</RetroButton>
          </div>
        </RetroWindow>

        {/* Input */}
        <RetroWindow title="retro-input.tsx">
          <div className="space-y-3">
            <RetroInput placeholder="Type something..." />
            <RetroInput placeholder="Disabled input" disabled />
          </div>
        </RetroWindow>

        {/* Status Badges */}
        <RetroWindow title="retro-status-badge.tsx">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <RetroStatusBadge key={status} status={status} />
            ))}
          </div>
        </RetroWindow>

        {/* Upgrade Gate */}
        <RetroWindow title="upgrade-gate.tsx">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground mb-2 text-xs">
                tier: &quot;pro&quot;
              </p>
              <UpgradeGate tier="pro">
                <div className="border-border rounded border p-3 text-sm">
                  Unlocked content
                </div>
              </UpgradeGate>
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs">
                tier: &quot;free&quot;
              </p>
              <UpgradeGate tier="free">
                <div className="border-border rounded border p-3 text-sm">
                  Locked content
                </div>
              </UpgradeGate>
            </div>
          </div>
        </RetroWindow>
      </div>
    </div>
  );
}
