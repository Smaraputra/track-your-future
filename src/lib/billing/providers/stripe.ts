import { stripe } from '../stripe';
import { PRICES } from '../plans';
import type { BillingProvider, CreateCheckoutParams } from '../provider';

export class StripeBillingProvider implements BillingProvider {
  name = 'stripe' as const;
  supportsNoCcTrial = true;

  async createCheckout(params: CreateCheckoutParams) {
    if (!stripe) throw new Error('Stripe not configured');

    let customerId = params.existingCustomerId ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: params.email ?? undefined,
        name: params.name ?? undefined,
        metadata: { userId: params.userId },
      });
      customerId = customer.id;
    }

    const priceId =
      params.interval === 'monthly'
        ? PRICES.monthly.priceId
        : PRICES.annual.priceId;

    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: params.userId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
      subscription_data: {
        trial_period_days: PRICES.trialDays,
      },
    });

    return { url: session.url };
  }

  async createPortalSession(params: { providerCustomerId: string }) {
    if (!stripe) throw new Error('Stripe not configured');

    const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: params.providerCustomerId,
      return_url: `${baseUrl}/settings`,
    });

    return { url: session.url };
  }

  async cancelSubscription(params: { providerSubscriptionId: string }) {
    if (!stripe) throw new Error('Stripe not configured');

    await stripe.subscriptions.cancel(params.providerSubscriptionId);
  }
}
