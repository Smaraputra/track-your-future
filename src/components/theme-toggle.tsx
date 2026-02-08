'use client';

import { Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'text-muted-foreground hover:text-foreground font-body inline-flex items-center gap-1.5 text-xs transition-colors',
        className
      )}
      aria-label={`Switch to ${theme === 'green' ? 'amber' : 'green'} theme`}
    >
      <Monitor className="size-4" />
      <span className="text-primary font-medium uppercase">
        [{theme}]
      </span>
    </button>
  );
}
