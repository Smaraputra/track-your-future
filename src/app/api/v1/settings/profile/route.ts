import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

export const GET = withApiToken('read', async (_request, _ctx, { userId }) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, email: true, image: true },
  });

  if (!user) return apiError('not_found', 'User not found', 404);

  return apiOk(user);
});

export const PATCH = withApiToken('write', async (request, _ctx, { userId }) => {
  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  if (parsed.data.name === undefined) {
    return apiError('no_fields', 'No fields to update', 400);
  }

  const [updated] = await db
    .update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, userId))
    .returning({ id: users.id, name: users.name, email: users.email });

  return apiOk(updated);
});
