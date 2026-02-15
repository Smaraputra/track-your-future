import { polar } from '../polar';
import { PRICES } from '../plans';
import type { BillingProvider, CreateCheckoutParams } from '../provider';

export class PolarBillingProvider implements BillingProvider {
  name = 'polar' as const;
  supportsNoCcTrial = false;

  async createCheckout(params: CreateCheckoutParams) {
    if (!polar) throw new Error('Polar not configured');

    const productId =
      params.interval === 'monthly'
        ? PRICES.monthly.productId
        : PRICES.annual.productId;

    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

    const checkout = await polar.checkouts.create({
      products: [productId],
      externalCustomerId: params.userId,
      customerEmail: params.email ?? undefined,
      customerName: params.name ?? undefined,
      successUrl: `${baseUrl}/settings?checkout=success`,
      metadata: { userId: params.userId },
    });

    return { url: checkout.url };
  }

  async createPortalSession(params: { providerCustomerId: string }) {
    if (!polar) throw new Error('Polar not configured');

    const session = await polar.customerSessions.create({
      customerId: params.providerCustomerId,
    });

    return { url: session.customerPortalUrl };
  }

  async cancelSubscription(params: { providerSubscriptionId: string }) {
    if (!polar) throw new Error('Polar not configured');

    await polar.subscriptions.revoke({ id: params.providerSubscriptionId });
  }
}
