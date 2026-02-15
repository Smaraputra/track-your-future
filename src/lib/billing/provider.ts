export type BillingProviderName = 'stripe' | 'polar';

export interface CreateCheckoutParams {
  userId: string;
  email: string | null;
  name: string | null;
  interval: 'monthly' | 'annual';
  existingCustomerId: string | null;
}

export interface BillingProvider {
  name: BillingProviderName;
  supportsNoCcTrial: boolean;
  createCheckout(params: CreateCheckoutParams): Promise<{ url: string | null }>;
  createPortalSession(params: {
    providerCustomerId: string;
  }): Promise<{ url: string }>;
  cancelSubscription(params: {
    providerSubscriptionId: string;
  }): Promise<void>;
}

export function getBillingProviderName(): BillingProviderName {
  const provider = process.env.BILLING_PROVIDER;
  if (provider === 'polar') return 'polar';
  return 'stripe';
}

export async function getBillingProvider(): Promise<BillingProvider | null> {
  const name = getBillingProviderName();
  if (name === 'polar') {
    const { PolarBillingProvider } = await import('./providers/polar');
    return new PolarBillingProvider();
  }
  const { StripeBillingProvider } = await import('./providers/stripe');
  return new StripeBillingProvider();
}
