# Phase 7: Billing (Stripe)

## Architecture

- **Stripe Checkout** (embedded mode) for subscription creation
- **Stripe Billing** for lifecycle (trials, proration, dunning with Smart Retries)
- **Stripe Tax** for automatic tax calculation/collection
- **Stripe Customer Portal** for self-service (payment methods, invoices, cancel)

## Implementation Files

- `src/app/api/checkout/route.ts` -- create Checkout Session
- `src/app/api/webhooks/stripe/route.ts` -- webhook handler (idempotent via webhook_events table)
- `src/lib/billing/stripe.ts` -- Stripe client singleton
- `src/lib/billing/plans.ts` -- PLAN_LIMITS config object
- `src/lib/billing/feature-gate.ts` -- `canAccess()`, `checkLimit()`, `getUserSubscription()`

## Webhook Events Handled

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

## Plan Limits

| Resource/Feature | Free | Pro ($9/mo) |
|-----------------|------|-------------|
| Applications | 25 | Unlimited |
| Documents | 10 | Unlimited |
| Role categories | 3 | Unlimited |
| Storage | 50 MB | 200 MB |
| Form field templates | 20 | Unlimited |
| AI: CV parses/mo | 3 | Unlimited |
| AI: JD extractions/mo | 5 | Unlimited |
| AI: Match scores/mo | 3 | Unlimited |
| AI: Cover letters/mo | 0 | 20 |
| AI: Interview prep/mo | 0 | 20 |
| AI: Resume suggestions/mo | 0 | 10 |
| Analytics | Current month | All time |
| Email notifications | No | Yes |
| Data export | JSON | JSON + CSV |

Annual pricing: $79/year (27% discount).
14-day free trial on Pro, no credit card required.

## UI

- **Pricing page**: comparison table with CTA buttons
- **Settings page**: "Manage Subscription" button (Stripe Customer Portal redirect)
- **UpgradeGate**: wraps Pro features with lock icon + tooltip
- **Past-due banner**: payment warning shown in header, access still allowed

## Status

- [x] Stripe client setup
- [x] Plan limits config
- [x] Feature gating functions
- [x] Checkout Session API route
- [x] Webhook handler (idempotent)
- [x] Customer Portal redirect
- [x] Pricing page
- [x] Upgrade prompts (UpgradeGate component)
- [x] Past-due banner
