import { notFound } from 'next/navigation';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { FileText, Briefcase, FileStack } from 'lucide-react';

import { auth } from '@/auth';
import { db } from '@/db';
import { roleCategories, documents, formFieldTemplates } from '@/db/schema/core';
import { applications } from '@/db/schema/applications';
import { parsedProfiles } from '@/db/schema/ai';
import { checkResourceLimit, getUserSubscription } from '@/lib/billing/feature-gate';
import { safeDecryptField } from '@/lib/crypto/field-encryption';
import { RetroWindow } from '@/components/retro-window';
import { RetroButton } from '@/components/retro-button';
import { RoleColorBadge } from '@/components/roles/role-color-badge';
import { RoleDetailActions } from '@/components/roles/role-detail-actions';
import { TemplateList } from '@/components/templates/template-list';
import { RoleDocumentList } from '@/components/documents/role-document-list';

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

  const userId = session!.user!.id;
  const sub = await getUserSubscription(userId);

  const [
    [docCount],
    [appCount],
    [templateCount],
    templates,
    [globalTemplateCount],
    roleDocs,
    allRoles,
    docLimit,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(documents)
      .where(
        and(eq(documents.roleCategoryId, roleId), eq(documents.isLatest, true)),
      ),
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
          eq(formFieldTemplates.userId, userId),
        ),
      )
      .orderBy(
        asc(formFieldTemplates.position),
        asc(formFieldTemplates.createdAt),
      ),
    db
      .select({ count: count() })
      .from(formFieldTemplates)
      .where(eq(formFieldTemplates.userId, userId)),
    db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        documentType: documents.documentType,
        customTypeName: documents.customTypeName,
        mimeType: documents.mimeType,
        fileSizeBytes: documents.fileSizeBytes,
        version: documents.version,
        createdAt: documents.createdAt,
        roleCategoryId: documents.roleCategoryId,
        roleCategoryName: roleCategories.name,
        roleCategoryColor: roleCategories.color,
        parsedProfileId: parsedProfiles.id,
      })
      .from(documents)
      .leftJoin(roleCategories, eq(documents.roleCategoryId, roleCategories.id))
      .leftJoin(parsedProfiles, eq(documents.id, parsedProfiles.documentId))
      .where(
        and(
          eq(documents.roleCategoryId, roleId),
          eq(documents.userId, userId),
          eq(documents.isLatest, true),
        ),
      )
      .orderBy(desc(documents.createdAt)),
    db
      .select({
        id: roleCategories.id,
        name: roleCategories.name,
        color: roleCategories.color,
      })
      .from(roleCategories)
      .where(eq(roleCategories.userId, userId))
      .orderBy(asc(roleCategories.name)),
    checkResourceLimit(userId, 'documents', sub.tier),
  ]);

  const serializedRoleDocs = roleDocs.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  const decryptedTemplates = templates.map((t) => ({
    ...t,
    fieldValue: safeDecryptField(t.fieldValue, userId),
  }));

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
          initialTemplates={decryptedTemplates}
          globalTemplateCount={globalTemplateCount.count}
        />

        <RoleDocumentList
          roleId={roleId}
          initialDocuments={serializedRoleDocs}
          roles={allRoles}
          globalDocumentCount={docLimit.current}
        />

        <div className="pt-2">
          <RetroButton asChild variant="secondary" size="sm">
            <Link href="/roles">Back to Roles</Link>
          </RetroButton>
        </div>
      </div>
    </RetroWindow>
  );
}
