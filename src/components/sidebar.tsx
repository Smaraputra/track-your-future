'use client';

import { useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NAV_ITEMS } from '@/components/nav-items';
import { cn } from '@/lib/utils';

const SIDEBAR_STORAGE_KEY = 'tyf-sidebar-collapsed';

const sidebarListeners = new Set<() => void>();

function sidebarSubscribe(callback: () => void) {
  sidebarListeners.add(callback);
  return () => sidebarListeners.delete(callback);
}

function getSidebarSnapshot(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    sidebarSubscribe,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );

  const toggleCollapsed = useCallback(() => {
    const next = !getSidebarSnapshot();
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
    } catch {
      // localStorage not available
    }
    sidebarListeners.forEach((l) => l());
  }, []);

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'border-border bg-sidebar crt-screen flex h-full flex-col border-r transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-56',
        className
      )}
    >
      <div className="border-border flex items-center justify-between border-b p-3">
        {collapsed ? (
          <span className="block size-2 rounded-full bg-primary animate-pulse mx-auto" aria-hidden="true" />
        ) : (
          <span className="font-heading text-primary text-shadow-glow flex items-center gap-2 text-lg">
            <span className="block size-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            TYF
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-2" role="navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'text-primary bg-accent font-medium text-phosphor border-glow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && (
                    <span>
                      {isActive && (
                        <span className="text-primary mr-1">&gt;</span>
                      )}
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="border-border border-t p-3">
          <span className="font-body text-muted-foreground/50 text-xs">TYF v2.0.26</span>
        </div>
      )}
    </aside>
  );
}
