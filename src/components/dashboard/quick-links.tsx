'use client';

import Link from 'next/link';

interface RoleCategory {
  id: string;
  name: string;
  color: string | null;
  appCount: number;
}

interface QuickLinksProps {
  roleCategories: RoleCategory[];
}

export function QuickLinks({ roleCategories }: QuickLinksProps) {
  return (
    <div className="space-y-3">
      {roleCategories.length === 0 ? (
        <p className="font-body text-muted-foreground text-sm">
          No roles yet.{' '}
          <Link href="/roles" className="text-primary hover:underline">
            Create your first role
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-1.5">
          {roleCategories.map((role) => (
            <li key={role.id}>
              <Link
                href={`/roles/${role.id}`}
                className="hover:bg-accent/50 border-glow flex items-center gap-2 rounded px-2 py-1.5 transition-colors"
              >
                {role.color && (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                )}
                <span className="font-body text-foreground flex-1 text-sm">
                  {role.name}
                </span>
                <span className="font-body text-muted-foreground text-xs">
                  {role.appCount} app{role.appCount !== 1 ? 's' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Link
          href="/applications"
          className="font-body text-primary text-phosphor text-xs hover:underline"
        >
          All Applications
        </Link>
        <Link
          href="/roles"
          className="font-body text-primary text-phosphor text-xs hover:underline"
        >
          All Roles
        </Link>
        <Link
          href="/documents"
          className="font-body text-primary text-phosphor text-xs hover:underline"
        >
          Documents
        </Link>
      </div>
    </div>
  );
}
