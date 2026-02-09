'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus } from 'lucide-react';

import { RetroButton } from '@/components/retro-button';
import { RoleColorBadge } from '@/components/roles/role-color-badge';
import { useSubscription } from '@/hooks/use-subscription';
import { PLAN_LIMITS } from '@/lib/billing/plans';

interface Role {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
}

interface RoleListProps {
  initialRoles: Role[];
  onDeleteRequest: (role: Role) => void;
}

export function RoleList({ initialRoles, onDeleteRequest }: RoleListProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const { tier } = useSubscription();
  const limit = PLAN_LIMITS[tier].resources.roleCategories;

  const refreshRoles = useCallback(async () => {
    const res = await fetch('/api/roles');
    if (res.ok) {
      const data = await res.json();
      setRoles(data);
    }
  }, []);

  async function handleReorder(index: number, direction: 'up' | 'down') {
    const newRoles = [...roles];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newRoles.length) return;

    // Optimistic update
    [newRoles[index], newRoles[swapIndex]] = [newRoles[swapIndex], newRoles[index]];
    setRoles(newRoles);

    const orderedIds = newRoles.map((r) => r.id);
    const res = await fetch('/api/roles/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    });

    if (!res.ok) {
      refreshRoles();
    }
  }

  const atLimit = limit !== null && roles.length >= limit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-muted-foreground text-sm">
          {roles.length} role{roles.length !== 1 ? 's' : ''}
          {limit !== null ? ` / ${limit} max` : ''}
        </p>
        <RetroButton asChild size="sm" disabled={atLimit}>
          <Link href={atLimit ? '#' : '/roles/new'}>
            <Plus className="size-4" />
            New Role
          </Link>
        </RetroButton>
      </div>

      {roles.length === 0 ? (
        <div className="border-border rounded-md border p-8 text-center">
          <p className="font-heading text-primary text-lg">No Roles Yet</p>
          <p className="font-body text-muted-foreground mt-1 text-sm">
            Create role categories to organize your job search by position type.
          </p>
          <RetroButton asChild size="sm" className="mt-4">
            <Link href="/roles/new">
              <Plus className="size-4" />
              Create Your First Role
            </Link>
          </RetroButton>
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role, index) => (
            <div
              key={role.id}
              className="border-border flex items-center gap-3 rounded-md border px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => handleReorder(index, 'up')}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                  aria-label={`Move ${role.name} up`}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReorder(index, 'down')}
                  disabled={index === roles.length - 1}
                  className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors"
                  aria-label={`Move ${role.name} down`}
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>

              <RoleColorBadge color={role.color} />

              <div className="min-w-0 flex-1">
                <Link
                  href={`/roles/${role.id}`}
                  className="font-body text-foreground hover:text-primary text-sm font-medium transition-colors"
                >
                  {role.name}
                </Link>
                {role.description && (
                  <p className="font-body text-muted-foreground truncate text-xs">
                    {role.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <RetroButton asChild variant="ghost" size="icon">
                  <Link href={`/roles/${role.id}/edit`} aria-label={`Edit ${role.name}`}>
                    <Pencil className="size-4" />
                  </Link>
                </RetroButton>
                <RetroButton
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteRequest(role)}
                  aria-label={`Delete ${role.name}`}
                >
                  <Trash2 className="size-4" />
                </RetroButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {atLimit && tier === 'free' && (
        <p className="font-body text-muted-foreground text-center text-xs">
          Free plan limit reached.{' '}
          <Link href="/pricing" className="text-primary hover:underline">
            Upgrade to Pro
          </Link>{' '}
          for unlimited roles.
        </p>
      )}
    </div>
  );
}
