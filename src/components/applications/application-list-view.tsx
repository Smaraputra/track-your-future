'use client';

import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';

import { RetroStatusBadge } from '@/components/retro-status-badge';
import { RetroButton } from '@/components/retro-button';
import { type ApplicationItem } from './applications-page-content';

interface ApplicationListViewProps {
  applications: ApplicationItem[];
  onDelete: (app: ApplicationItem) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ApplicationListView({
  applications,
  onDelete,
}: ApplicationListViewProps) {
  return (
    <div className="space-y-2">
      {applications.map((app) => (
        <div
          key={app.id}
          className="border-border bg-surface flex items-center justify-between gap-4 rounded-md border p-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/applications/${app.id}`}
                className="font-heading text-primary truncate hover:underline"
              >
                {app.companyName}
              </Link>
              <RetroStatusBadge status={app.currentStatus} />
            </div>
            <div className="font-body text-muted-foreground mt-0.5 flex items-center gap-2 text-xs">
              <span className="truncate">{app.jobTitle}</span>
              {app.roleCategoryName && (
                <>
                  <span className="text-border">|</span>
                  <span
                    className="truncate"
                    style={
                      app.roleCategoryColor
                        ? { color: app.roleCategoryColor }
                        : undefined
                    }
                  >
                    {app.roleCategoryName}
                  </span>
                </>
              )}
              <span className="text-border">|</span>
              <span>{formatDate(app.appliedAt)}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <RetroButton
              variant="ghost"
              size="icon"
              asChild
            >
              <Link
                href={`/applications/${app.id}/edit`}
                aria-label={`Edit ${app.companyName}`}
              >
                <Pencil className="size-4" />
              </Link>
            </RetroButton>
            <RetroButton
              variant="ghost"
              size="icon"
              onClick={() => onDelete(app)}
              aria-label={`Delete ${app.companyName}`}
            >
              <Trash2 className="size-4" />
            </RetroButton>
          </div>
        </div>
      ))}
    </div>
  );
}
