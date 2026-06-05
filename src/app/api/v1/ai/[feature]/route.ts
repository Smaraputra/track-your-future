import { desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { AI_FEATURE_TABLES, isAiFeatureSlug } from '@/lib/api/v1/ai-features';
import { withApiToken } from '@/lib/api/v1/with-token';
import { apiOk, apiError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ feature: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { feature } = await params;
  if (!isAiFeatureSlug(feature)) {
    return apiError('not_found', `Unknown AI feature "${feature}"`, 404);
  }

  const table = AI_FEATURE_TABLES[feature];
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.userId, userId))
    .orderBy(desc(table.createdAt))
    .limit(100);

  return apiOk(rows);
});
