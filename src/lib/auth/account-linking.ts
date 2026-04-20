import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users } from '@/db/schema/auth';
import {
  evaluateOauthLinking,
  type OauthLinkingDecision,
} from './account-linking-rules';

export async function isOauthLinkingAllowed(
  provider: string,
  email: string,
): Promise<OauthLinkingDecision> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) {
    return { allowed: false, reason: 'existing_account' };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, normalized),
    with: { accounts: true },
  });

  const existingAccount =
    existing?.accounts.find((account) => account.provider === provider) ?? null;

  return evaluateOauthLinking({
    provider,
    existingUser: existing
      ? {
          emailVerified: existing.emailVerified,
          hashedPassword: existing.hashedPassword,
        }
      : null,
    existingAccount,
  });
}
