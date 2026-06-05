import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { notifications } from '@/db/schema/notifications';
import { withApiToken } from '@/lib/api/v1/with-token';
import { apiOk } from '@/lib/api/v1/response';

export const GET = withApiToken('read', async (request, _ctx, { userId }) => {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';

  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));

  const items = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return apiOk(items);
});
