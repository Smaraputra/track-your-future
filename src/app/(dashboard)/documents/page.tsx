import { and, asc, desc, eq, sum } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { documents, roleCategories } from '@/db/schema/core';
import { parsedProfiles } from '@/db/schema/ai';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { RetroWindow } from '@/components/retro-window';
import { DocumentsPageContent } from '@/components/documents/documents-page-content';

export default async function DocumentsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const sub = await getUserSubscription(userId);

  const [docs, roles, docLimit, storageResult] = await Promise.all([
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
      .where(and(eq(documents.userId, userId), eq(documents.isLatest, true)))
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
    db
      .select({ total: sum(documents.fileSizeBytes) })
      .from(documents)
      .where(eq(documents.userId, userId)),
  ]);

  const storageUsed = Number(storageResult[0]?.total ?? 0);
  const storageLimitCheck = await checkResourceLimit(userId, 'storageBytes', sub.tier);
  const storageLimit = storageLimitCheck.limit;

  const serializedDocs = docs.map((d) => ({
    ...d,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <RetroWindow title="sys://documents">
      <DocumentsPageContent
        initialDocuments={serializedDocs}
        roles={roles}
        documentCount={docLimit.current}
        documentLimit={docLimit.limit}
        storageUsed={storageUsed}
        storageLimit={storageLimit}
      />
    </RetroWindow>
  );
}
