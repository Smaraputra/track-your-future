import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { notifications } from '@/db/schema/notifications';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ notificationId: string }> };

const updateNotificationSchema = z.object({
  isRead: z.boolean(),
});

export const PATCH = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { notificationId } = await params;

  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = updateNotificationSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const [updated] = await db
    .update(notifications)
    .set({ isRead: parsed.data.isRead })
    .where(
      and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    )
    .returning();

  if (!updated) return apiError('not_found', 'Notification not found', 404);

  return apiOk(updated);
});
