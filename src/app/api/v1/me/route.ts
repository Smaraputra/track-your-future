import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { withApiToken } from '@/lib/api/v1/with-token';
import { apiOk, apiError } from '@/lib/api/v1/response';

export const GET = withApiToken('read', async (_request, _ctx, { userId, scope }) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      onboardingCompleted: true,
      createdAt: true,
    },
  });

  if (!user) return apiError('not_found', 'User not found', 404);

  const sub = await getUserSubscription(userId);

  return apiOk({ ...user, tier: sub.tier, tokenScope: scope });
});
