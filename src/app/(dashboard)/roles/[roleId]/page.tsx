import { notFound } from 'next/navigation';
import { and, asc, count, eq } from 'drizzle-orm';
import Link from 'next/link';
import { FileText, Briefcase, FileStack } from 'lucide-react';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories, documents, formFieldTemplates } from '@/db/schema/core';
import { applications } from '@/db/schema/applications';
import { RetroWindow } from '@/components/retro-window';
import { RetroButton } from '@/components/retro-button';
import { RoleColorBadge } from '@/components/roles/role-color-badge';
import { RoleDetailActions } from '@/components/roles/role-detail-actions';
import { TemplateList } from '@/components/templates/template-list';

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const session = await auth();
  const { roleId } = await params;

  const role = await db.query.roleCategories.findFirst({
    where: and(
      eq(roleCategories.id, roleId),
      eq(roleCategories.userId, session!.user!.id),
    ),
  });

  if (!role) {
    notFound();
  }

  const [
    [docCount],
    [appCount],
    [templateCount],
    templates,
    [globalTemplateCount],
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.roleCategoryId, roleId)),
    db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.roleCategoryId, roleId)),
    db
      .select({ count: count() })
      .from(formFieldTemplates)
      .where(eq(formFieldTemplates.roleCategoryId, roleId)),
    db
      .select({
        id: formFieldTemplates.id,
        fieldKey: formFieldTemplates.fieldKey,
        fieldValue: formFieldTemplates.fieldValue,
        position: formFieldTemplates.position,
      })
      .from(formFieldTemplates)
      .where(
        and(
          eq(formFieldTemplates.roleCategoryId, roleId),
          eq(formFieldTemplates.userId, session!.user!.id),
        ),
      )
      .orderBy(
        asc(formFieldTemplates.position),
        asc(formFieldTemplates.createdAt),
      ),
    db
      .select({ count: count() })
      .from(formFieldTemplates)
      .where(eq(formFieldTemplates.userId, session!.user!.id)),
  ]);

  return (
    <RetroWindow title={`sys://roles/${role.name}`}>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <RoleColorBadge color={role.color} />
            <div>
              <h1 className="font-heading text-primary text-2xl">{role.name}</h1>
              {role.description && (
                <p className="font-body text-muted-foreground mt-1 text-sm">
                  {role.description}
                </p>
              )}
            </div>
          </div>
          <RoleDetailActions roleId={role.id} roleName={role.name} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-border rounded-md border p-4">
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground size-4" />
              <span className="font-body text-muted-foreground text-sm">
                Documents
              </span>
            </div>
            <p className="font-heading text-primary mt-1 text-xl">
              {docCount.count}
            </p>
          </div>
          <div className="border-border rounded-md border p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="text-muted-foreground size-4" />
              <span className="font-body text-muted-foreground text-sm">
                Applications
              </span>
            </div>
            <p className="font-heading text-primary mt-1 text-xl">
              {appCount.count}
            </p>
          </div>
          <div className="border-border rounded-md border p-4">
            <div className="flex items-center gap-2">
              <FileStack className="text-muted-foreground size-4" />
              <span className="font-body text-muted-foreground text-sm">
                Templates
              </span>
            </div>
            <p className="font-heading text-primary mt-1 text-xl">
              {templateCount.count}
            </p>
          </div>
        </div>

        <TemplateList
          roleId={roleId}
          initialTemplates={templates}
          globalTemplateCount={globalTemplateCount.count}
        />

        <div className="border-border rounded-md border p-6 text-center">
          <p className="font-body text-muted-foreground text-sm">
            Linked documents will appear here in Step 13.
          </p>
        </div>

        <div className="pt-2">
          <RetroButton asChild variant="secondary" size="sm">
            <Link href="/roles">Back to Roles</Link>
          </RetroButton>
        </div>
      </div>
    </RetroWindow>
  );
}
