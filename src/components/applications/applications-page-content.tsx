'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Plus, Briefcase, List, LayoutGrid } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { ApplicationListView } from '@/components/applications/application-list-view';
import { DeleteApplicationDialog } from '@/components/applications/delete-application-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSubscription } from '@/hooks/use-subscription';
import { APPLICATION_STATUSES, STATUS_CONFIG } from '@/lib/applications';

export interface ApplicationItem {
  id: string;
  companyName: string;
  jobTitle: string;
  jobUrl: string | null;
  currentStatus: string;
  appliedAt: string | null;
  roleCategoryId: string | null;
  roleCategoryName: string | null;
  roleCategoryColor: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
}

interface Role {
  id: string;
  name: string;
  color: string | null;
}

interface ApplicationsPageContentProps {
  initialApplications: ApplicationItem[];
  roles: Role[];
  applicationCount: number;
  applicationLimit: number | null;
}

export function ApplicationsPageContent({
  initialApplications,
  roles,
  applicationCount: initialCount,
  applicationLimit,
}: ApplicationsPageContentProps) {
  const [applications, setApplications] =
    useState<ApplicationItem[]>(initialApplications);
  const [appCount, setAppCount] = useState(initialCount);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [deleteTarget, setDeleteTarget] = useState<ApplicationItem | null>(
    null,
  );
  const { tier } = useSubscription();

  const refreshApplications = useCallback(async () => {
    const res = await fetch('/api/applications');
    if (res.ok) {
      const data = await res.json();
      setApplications(
        data.map((d: Record<string, unknown>) => ({
          ...d,
          appliedAt: d.appliedAt
            ? new Date(d.appliedAt as string).toISOString()
            : null,
          createdAt: new Date(d.createdAt as string).toISOString(),
          updatedAt: new Date(d.updatedAt as string).toISOString(),
        })),
      );
      setAppCount(data.length);
    }
  }, []);

  function handleDeleted() {
    setDeleteTarget(null);
    refreshApplications();
  }

  async function handleStatusChange(
    applicationId: string,
    newStatus: string,
  ) {
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      refreshApplications();
    }
  }

  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'all' && app.currentStatus !== statusFilter)
      return false;
    if (roleFilter !== 'all') {
      if (roleFilter === 'none' && app.roleCategoryId !== null) return false;
      if (roleFilter !== 'none' && app.roleCategoryId !== roleFilter)
        return false;
    }
    return true;
  });

  const atLimit = applicationLimit !== null && appCount >= applicationLimit;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-muted-foreground text-sm">
          {appCount} application{appCount !== 1 ? 's' : ''}
          {applicationLimit !== null ? ` / ${applicationLimit}` : ''}
        </p>
        <div className="flex items-center gap-2">
          <div className="border-border flex rounded-md border">
            <RetroButton
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className="rounded-r-none border-0"
            >
              <List className="size-4" />
            </RetroButton>
            <RetroButton
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('board')}
              aria-label="Board view"
              className="rounded-l-none border-0"
            >
              <LayoutGrid className="size-4" />
            </RetroButton>
          </div>
          <RetroButton size="sm" disabled={atLimit} asChild>
            <Link href="/applications/new">
              <Plus className="size-4" />
              New
            </Link>
          </RetroButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]" size="sm">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_CONFIG[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]" size="sm">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="none">No Role</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="border-border rounded-md border p-8 text-center">
          <Briefcase className="text-muted-foreground mx-auto size-8" />
          <p className="font-heading text-primary mt-2 text-lg">
            {applications.length === 0
              ? 'No Applications Yet'
              : 'No Matching Applications'}
          </p>
          <p className="font-body text-muted-foreground mt-1 text-sm">
            {applications.length === 0
              ? 'Create your first application to start tracking.'
              : 'Try adjusting your filters.'}
          </p>
          {applications.length === 0 && (
            <RetroButton size="sm" className="mt-4" disabled={atLimit} asChild>
              <Link href="/applications/new">
                <Plus className="size-4" />
                Create Your First Application
              </Link>
            </RetroButton>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <ApplicationListView
          applications={filteredApplications}
          onDelete={setDeleteTarget}
        />
      ) : (
        <div className="font-body text-muted-foreground border-border rounded-md border p-8 text-center text-sm">
          Board view placeholder -- wired in next commit
        </div>
      )}

      {atLimit && tier === 'free' && (
        <p className="font-body text-muted-foreground text-center text-xs">
          Free plan application limit reached.{' '}
          <Link href="/pricing" className="text-primary hover:underline">
            Upgrade to Pro
          </Link>{' '}
          for unlimited applications.
        </p>
      )}

      {deleteTarget && (
        <DeleteApplicationDialog
          applicationId={deleteTarget.id}
          companyName={deleteTarget.companyName}
          jobTitle={deleteTarget.jobTitle}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}

export { type ApplicationsPageContentProps };
