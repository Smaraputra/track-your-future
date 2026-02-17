import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { getBillingProviderName } from '@/lib/billing/provider';
import { PricingTable } from '@/components/pricing-table';
import { BILLING_DISABLED } from '@/lib/billing/plans';
import type { Tier } from '@/lib/billing/plans';

export const metadata: Metadata = {
  title: 'Pricing - Tracked Your Future',
};

export default async function PricingPage() {
  const session = await auth();
  let currentTier: Tier = 'free';

  if (session?.user?.id) {
    const sub = await getUserSubscription(session.user.id);
    currentTier = sub.tier;
  }

  return (
    <div className="py-8 px-4">
      <div className="mx-auto max-w-4xl text-center mb-8">
        <h1 className="font-heading text-foreground text-4xl mb-2">
          Pricing
        </h1>
        <p className="font-body text-muted-foreground">
          {BILLING_DISABLED
            ? 'All features are currently free'
            : 'Choose the plan that fits your job search'}
        </p>
      </div>
      <PricingTable
        currentTier={currentTier}
        isAuthenticated={!!session?.user}
        billingProvider={getBillingProviderName()}
        billingDisabled={BILLING_DISABLED}
      />
    </div>
  );
}
