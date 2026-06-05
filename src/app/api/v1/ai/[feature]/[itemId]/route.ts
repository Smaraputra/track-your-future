import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { AI_FEATURE_TABLES, isAiFeatureSlug } from '@/lib/api/v1/ai-features';
import { withApiToken } from '@/lib/api/v1/with-token';
import { apiOk, apiError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ feature: string; itemId: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { feature, itemId } = await params;
  if (!isAiFeatureSlug(feature)) {
    return apiError('not_found', `Unknown AI feature "${feature}"`, 404);
  }

  const table = AI_FEATURE_TABLES[feature];
  const [row] = await db
    .select()
    .from(table)
    .where(and(eq(table.id, itemId), eq(table.userId, userId)))
    .limit(1);

  if (!row) return apiError('not_found', 'Item not found', 404);

  return apiOk(row);
});
