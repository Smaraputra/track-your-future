# Session 08 Handover -- 2026-02-09

## Summary

Implemented Step 9: Stripe Billing. All 7 commits completed. 422 tests passing (116 new tests added to previous 306).

## What Was Done

### Commit 1: feat(billing): add Stripe client and plan limits config
- Installed `stripe@20.3.1`
- Created `src/lib/billing/stripe.ts` -- singleton following redis.ts pattern (globalThis for dev hot reload, returns null when STRIPE_SECRET_KEY is not set)
- Created `src/lib/billing/plans.ts` -- `PLAN_LIMITS` config (Free/Pro resource and AI limits), `PRICES` config (monthly $9, annual $79, 14-day trial), `canAccess()` pure function, type exports (Tier, ResourceKey, AiFeatureKey)

### Commit 2: feat(billing): add feature gating functions
- Created `src/lib/billing/feature-gate.ts`:
  - `getUserSubscription(userId)` -- React `cache()` wrapped, queries subscriptions where status IN (active, trialing, past_due), returns free defaults when no row exists
  - `checkResourceLimit(userId, resource, tier)` -- counts via DB query, compares to PLAN_LIMITS
  - `checkAiLimit(userId, feature, tier)` -- counts aiUsage rows in current calendar month
- Created `src/lib/billing/index.ts` -- barrel export
- Moved `canAccess()` to plans.ts to avoid DB import chain in unit tests (feature-gate.ts imports db which throws without DATABASE_URL)

### Commit 3: feat(billing): add webhook handler with idempotent processing
- Created `src/app/api/webhooks/stripe/route.ts`:
  - POST handler: reads raw body via `request.text()`, verifies signature via `stripe.webhooks.constructEvent()`, records event in webhookEvents table for idempotency
  - 7 event handlers: checkout.session.completed, subscription created/updated/deleted, trial_will_end, invoice payment succeeded/failed
  - `mapStripeStatus()` maps Stripe statuses to local enum (including `incomplete_expired` to `canceled`)
  - Always returns 200 to prevent Stripe retries (errors are logged but not propagated)
  - Adapted for Stripe v20 API: `current_period_start/end` now on SubscriptionItem (not Subscription), `payment_intent` now in `invoice.payments.data[0].payment`
- Added `sendTrialEndingEmail()` to `src/lib/email.ts`
- Added `/api/webhooks/` to auth public paths in `src/auth.ts`

### Commit 4: feat(billing): add checkout, trial, and portal API routes
- `POST /api/checkout` -- Zod-validated interval (monthly/annual), checks existing active sub (409), get-or-create Stripe customer, creates Checkout Session with client_reference_id
- `POST /api/billing/trial` -- no-CC 14-day trial via `stripe.subscriptions.create()` with `missing_payment_method: 'cancel'`, prevents re-trial if trialEnd exists on canceled sub
- `POST /api/billing/portal` -- creates Stripe Customer Portal session, returns URL
- All routes return 503 when Stripe is not configured

### Commit 5: feat(billing): add subscription context and past-due banner
- Created `src/hooks/use-subscription.tsx` -- SubscriptionContext with SubscriptionProvider and useSubscription hook, default free tier
- Created `src/components/past-due-banner.tsx` -- renders warning banner with "Update Payment" button only when status === 'past_due'
- Modified `src/app/(dashboard)/layout.tsx` -- calls getUserSubscription, wraps children with SubscriptionProvider, adds PastDueBanner between header and main
- Refactored `src/components/upgrade-gate.tsx` -- removed `tier` prop, now uses useSubscription context
- Updated existing UpgradeGate tests to wrap with SubscriptionProvider

### Commit 6: feat(billing): add pricing page
- Created `src/components/pricing-table.tsx` -- client component with monthly/annual toggle ("Save 27%" badge), Free/Pro comparison cards in RetroWindow style, resource and AI feature limit tables, CTAs based on auth/tier state
- Replaced `src/app/(public)/pricing/page.tsx` stub -- server component that checks auth + subscription status, passes to PricingTable

### Commit 7: feat(billing): wire account deletion to Stripe cancellation
- Modified `src/app/api/settings/account/route.ts` -- replaced TODO with `stripe.subscriptions.cancel()`, handles active/trialing/past_due statuses, uses dynamic import to avoid loading Stripe for free users

### Testing
- 8 new test files: billing-plans, feature-gate, webhook-stripe, billing-routes, subscription-components, pricing-page
- Updated existing: layout-components (UpgradeGate now uses context), gdpr-endpoints (Stripe cancellation verified)
- Total: 422 tests passing (116 new)

## Verification Checklist
- [x] pnpm lint -- zero errors
- [x] pnpm typecheck -- zero errors
- [x] pnpm test -- 422 passing
- [x] pnpm build -- clean production build (33 pages + 6 API routes)
- [x] Phase plan updated (all checkboxes checked)
- [x] Implementation sequence updated (steps 9-10 marked Complete)

## Key Technical Decisions
- **Stripe v20 API changes**: `current_period_start/end` moved from Subscription to SubscriptionItem (`sub.items.data[0].current_period_start`). `payment_intent` on Invoice removed; now accessed via `invoice.payments.data[0].payment.payment_intent`. Adapted all handlers accordingly.
- **canAccess moved to plans.ts**: Pure function has no DB dependency, but was in feature-gate.ts which imports db. Unit tests would fail without DATABASE_URL. Moved to plans.ts for clean import chain.
- **Hosted Checkout over embedded**: Retro terminal UI (VT323/JetBrains Mono, green-on-black) would clash with Stripe Elements. Hosted Checkout uses Stripe's own UI.
- **No subscription row for free users**: getUserSubscription returns `{ tier: 'free', status: null }` when no row exists. No pre-created rows needed.
- **React cache() for subscription queries**: Instead of putting tier in JWT (staleness risk), getUserSubscription wraps DB query in cache() for per-request dedup.
- **Dynamic Stripe import in account deletion**: Uses `await import()` so free users don't load the Stripe SDK at all.
- **Dates as ISO strings in context**: Server component fetches Date objects, serializes to ISO strings for client-side SubscriptionProvider.

## Files Created (18)
- `src/lib/billing/stripe.ts`
- `src/lib/billing/plans.ts`
- `src/lib/billing/feature-gate.ts`
- `src/lib/billing/index.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/billing/trial/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/hooks/use-subscription.tsx`
- `src/components/past-due-banner.tsx`
- `src/components/pricing-table.tsx`
- `tests/unit/billing-plans.test.ts`
- `tests/unit/feature-gate.test.ts`
- `tests/unit/webhook-stripe.test.ts`
- `tests/unit/billing-routes.test.ts`
- `tests/unit/subscription-components.test.tsx`
- `tests/unit/pricing-page.test.tsx`
- `sessions/2026-02-09-session-08-handover.md`

## Files Modified (7)
- `src/auth.ts` (added /api/webhooks/ to public paths)
- `src/lib/email.ts` (added sendTrialEndingEmail)
- `src/app/(dashboard)/layout.tsx` (added SubscriptionProvider + PastDueBanner)
- `src/components/upgrade-gate.tsx` (removed tier prop, uses context)
- `src/app/(public)/pricing/page.tsx` (replaced stub with full implementation)
- `src/app/api/settings/account/route.ts` (wired Stripe cancellation)
- `tests/unit/layout-components.test.tsx` (UpgradeGate tests updated for context)
- `tests/unit/gdpr-endpoints.test.ts` (Stripe cancellation tests added)
- `plans/phase-07-billing.md` (all checkboxes checked)
- `plans/phase-12-implementation-sequence.md` (steps 9-10 Complete)
- `package.json` (added stripe dependency)

## Git State
- Branch: main
- 7 commits made in this session
- Latest: `b742923 feat(billing): wire account deletion to Stripe cancellation`

## Next Steps
- Step 11: Role Categories CRUD (Phase 9.1)
- Per plans/phase-12-implementation-sequence.md
