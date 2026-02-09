import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

function createStripeClient(): Stripe | null {
  if (!STRIPE_SECRET_KEY) return null;

  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
  });
}

export const stripe: Stripe | null =
  globalForStripe.stripe ?? createStripeClient();

if (process.env.NODE_ENV !== 'production' && stripe) {
  globalForStripe.stripe = stripe;
}
