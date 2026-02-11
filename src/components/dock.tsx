'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/components/nav-items';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function BottomDock() {
  const pathname = usePathname();
  const [bouncingIndex, setBouncingIndex] = useState<number | null>(null);
  const bounceTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handleClick = useCallback(
    (index: number, e: React.MouseEvent<HTMLAnchorElement>) => {
      // Set folder-open transform-origin from clicked icon position
      const rect = e.currentTarget.getBoundingClientRect();
      const main = document.querySelector('main');
      if (main) {
        const centerX = rect.left + rect.width / 2;
        const xPercent = (centerX / window.innerWidth) * 100;
        main.style.setProperty('--folder-origin-x', `${xPercent}%`);
        main.style.setProperty('--folder-origin-y', '100%');
      }

      // Trigger bounce
      setBouncingIndex(index);
      if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
      bounceTimeout.current = setTimeout(() => setBouncingIndex(null), 500);
    },
    [],
  );

  return (
    <TooltipProvider>
      <nav
        data-testid="dock"
        role="navigation"
        aria-label="Main navigation"
        className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2"
      >
        <div className="flex items-end gap-1 rounded-2xl border border-border bg-surface/90 px-2 py-2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.08)] backdrop-blur-md">
          <div className="dock-items flex items-end gap-1">
            {NAV_ITEMS.map((item, index) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={(e) => handleClick(index, e)}
                      className={cn(
                        'dock-item relative flex items-center justify-center rounded-lg p-2.5 transition-colors',
                        isActive
                          ? 'dock-item-active bg-accent text-primary'
                          : 'bg-accent/30 text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        bouncingIndex === index && 'animate-dock-bounce',
                      )}
                    >
                      <item.icon className="size-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="font-body bg-surface text-foreground border border-border text-xs"
                  >
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
