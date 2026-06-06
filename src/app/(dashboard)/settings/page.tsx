import { and, desc, eq, isNull } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { users, accounts, DEFAULT_EMAIL_PREFERENCES } from '@/db/schema/auth';
import { apiTokens } from '@/db/schema/api-tokens';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { isBillingDisabled } from '@/lib/billing/plans';
import { RetroWindow } from '@/components/retro-window';
import { SettingsContent } from '@/components/settings/settings-content';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;

  const [user, linkedAccounts, subscription, tokens] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
        emailPreferences: true,
        createdAt: true,
      },
    }),
    db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
      columns: { provider: true },
    }),
    getUserSubscription(userId),
    db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        tokenPrefix: apiTokens.tokenPrefix,
        scope: apiTokens.scope,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)))
      .orderBy(desc(apiTokens.createdAt)),
  ]);

  if (!user) return null;

  return (
    <RetroWindow title="sys://settings">
      <SettingsContent
        user={{
          id: user.id,
          name: user.name ?? '',
          email: user.email,
          hasPassword: !!user.hashedPassword,
          createdAt: user.createdAt.toISOString(),
        }}
        linkedProviders={linkedAccounts.map((a) => a.provider)}
        subscription={{
          tier: subscription.tier,
          status: subscription.status,
          trialEnd: subscription.trialEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        }}
        apiTokens={tokens.map((t) => ({
          id: t.id,
          name: t.name,
          tokenPrefix: t.tokenPrefix,
          scope: t.scope,
          lastUsedAt: t.lastUsedAt?.toISOString() ?? null,
          expiresAt: t.expiresAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        }))}
        emailPreferences={user.emailPreferences ?? DEFAULT_EMAIL_PREFERENCES}
        billingDisabled={isBillingDisabled()}
      />
    </RetroWindow>
  );
}
