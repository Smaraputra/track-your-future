import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { users, accounts } from '@/db/schema/auth';
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

  const [user, linkedAccounts, subscription] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
        createdAt: true,
      },
    }),
    db.query.accounts.findMany({
      where: eq(accounts.userId, userId),
      columns: { provider: true },
    }),
    getUserSubscription(userId),
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
        billingDisabled={isBillingDisabled()}
      />
    </RetroWindow>
  );
}
