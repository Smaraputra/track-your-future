'use client';

import { useTheme } from '@/hooks/use-theme';
import { useCRTOverlay } from '@/components/crt-overlay';

export function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();
  const { enabled: crtEnabled, toggle: toggleCrt } = useCRTOverlay();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-primary text-sm">Theme</h3>
        <p className="font-body text-muted-foreground mt-1 text-xs">
          Choose your terminal color scheme.
        </p>
        <div className="mt-3 flex gap-3">
          <button
            onClick={theme === 'green' ? undefined : toggleTheme}
            className={`font-body flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-all ${
              theme === 'green'
                ? 'border-green-500 bg-green-500/10 text-green-500'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="size-3 rounded-full bg-green-500" />
            Green
          </button>
          <button
            onClick={theme === 'amber' ? undefined : toggleTheme}
            className={`font-body flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-all ${
              theme === 'amber'
                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="size-3 rounded-full bg-amber-500" />
            Amber
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-heading text-primary text-sm">CRT Overlay</h3>
        <p className="font-body text-muted-foreground mt-1 text-xs">
          Enable retro CRT scanline effect overlay.
        </p>
        <button
          onClick={toggleCrt}
          className={`font-body mt-3 rounded-md border px-4 py-2 text-sm transition-all ${
            crtEnabled
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {crtEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
}
