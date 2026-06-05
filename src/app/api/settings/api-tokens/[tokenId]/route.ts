import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { apiTokens } from '@/db/schema/api-tokens';
import { logAuditEvent } from '@/lib/audit/log';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tokenId } = await params;

  // Soft revoke, scoped to the owner. Only active tokens can be revoked.
  const [revoked] = await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiTokens.id, tokenId),
        eq(apiTokens.userId, session.user.id),
        isNull(apiTokens.revokedAt),
      ),
    )
    .returning({ id: apiTokens.id });

  if (!revoked) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  await logAuditEvent({
    action: 'api_token_revoked',
    userId: session.user.id,
    request,
    metadata: { tokenId },
  });

  return NextResponse.json({ success: true });
}
