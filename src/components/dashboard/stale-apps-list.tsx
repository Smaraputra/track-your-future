'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface StaleApp {
  id: string;
  companyName: string;
  jobTitle: string;
  currentStatus: string;
  updatedAt: string;
  roleCategoryName: string | null;
  roleCategoryColor: string | null;
}

interface StaleAppsListProps {
  apps: StaleApp[];
}

function daysAgo(isoDate: string): number {
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function StaleAppsList({ apps }: StaleAppsListProps) {
  if (apps.length === 0) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        No stale applications. All apps are up to date.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {apps.map((app) => (
        <li key={app.id}>
          <Link
            href={`/applications/${app.id}`}
            className="border-border hover:border-primary/50 crt-screen border-glow flex items-center gap-3 rounded-md border p-3 transition-colors"
          >
            <AlertTriangle className="text-yellow-500 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-body text-foreground truncate text-sm">
                {app.companyName} - {app.jobTitle}
              </p>
              <p className="font-body text-muted-foreground text-xs">
                {app.currentStatus} -- {daysAgo(app.updatedAt)} days since last update
              </p>
            </div>
            {app.roleCategoryColor && (
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: app.roleCategoryColor }}
              />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
