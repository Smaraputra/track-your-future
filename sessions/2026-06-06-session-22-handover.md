# Session 22 Handover - 2026-06-06

## Summary
Enabled the email system end to end and built the previously-missing credentials registration + email-verification flow. Despite `plans/phase-03` checkboxes and project memory marking registration/verification "complete," the code did not exist: no register page, no signup API, no verify-email route, no register schema. Credentials login was gated on `users.emailVerified`, which nothing ever set, so email/password signup was impossible. This session built the full flow, refactored the email module to a shared branded template with categories, and added per-user email preferences.

## Scope Decisions (confirmed with user)
1. Registration -> build full credentials signup + email verification.
2. Billing/invoice emails -> skipped (billing disabled in prod, `BILLING_DISABLED=true`).
3. Reminders/scheduler -> skipped (`/api/cron/detect-stale` stays in-app only).
4. Templates/preferences -> shared branded template + per-user email preferences.

## Key Design Decisions
- **Mirrored the password-reset pattern.** Verification uses a dedicated `email_verification_tokens` table (hashed token, single-use `usedAt`, 24h TTL) and helpers in `src/lib/auth/email-verification.ts`, mirroring `passwordResetTokens` / `password-reset.ts`. NextAuth's unused `verification_tokens` table (adapter-owned) was left alone.
- **Email module stays db-free.** `@/db` throws at import without `DATABASE_URL`, and unit tests import the email senders. So the send layer does not import db; the one optional-category send (welcome) is gated at the call site in the verify route, where the user's `emailPreferences` is already loaded. The `category` still drives footer rendering.
- **Email link points to a page, not a GET mutation.** The verification email links to `/verify-email?token=...`, which renders a "Verify my email" button that POSTs to the API. Avoids email-scanner link prefetch consuming single-use tokens; matches the reset-password page+form pattern.
- **Enumeration resistance.** `register` and `resend` always return generic success; an already-verified email triggers an "account exists" notice instead of a duplicate.

## Changes Made

### Schema
- `src/db/schema/auth.ts`: new `email_verification_tokens` table (mirrors `password_reset_tokens`); new `users.email_preferences` jsonb (`{product, reminders}`, default both true, notNull). Exports `EmailPreferences` + `DEFAULT_EMAIL_PREFERENCES`.
- `src/db/schema/relations.ts`: registered `emailVerificationTokensRelations` + user relation.
- `src/db/schema/audit.ts`: added `user_registered`, `email_verification_sent`, `email_verified`.
- **New migration** `drizzle/0007_futuristic_naoko.sql`. Verified to apply cleanly against a fresh PostgreSQL 16 with the full migration set.

### Email module (refactored `src/lib/email.ts` -> `src/lib/email/`)
- `layout.ts`: shared branded retro-terminal HTML (`renderEmail`), `EmailCategory` type; product emails render a "Manage email preferences" footer.
- `send.ts`: core `sendEmail` (db-free), `getBaseUrl`, redacted dev logging, `EMAIL_DEV_SEND=true` to deliver real email in dev.
- `index.ts`: senders -- `sendVerificationEmail`, `sendWelcomeEmail` (product), `sendAccountExistsEmail`, plus existing `sendPasswordResetEmail` / `sendLoginLockoutEmail` / `sendTrialEndingEmail` re-rendered through the layout (public names unchanged, so `src/auth.ts`, the reset route, and the Stripe webhook keep working).
- `.env.example`: documented `EMAIL_DEV_SEND`.

### Auth helpers + routes
- **New** `src/lib/auth/email-verification.ts` (token gen/hash/expiry, 24h TTL).
- `src/lib/auth/schemas.ts`: `registerSchema`, `resendVerificationSchema`, `verifyEmailSchema`.
- `src/lib/rate-limit-configs.ts`: `REGISTER_LIMIT`, `EMAIL_VERIFY_RESEND_LIMIT`, `EMAIL_VERIFY_CONFIRM_LIMIT`.
- **New** `src/app/api/auth/register/route.ts`, `verify-email/route.ts`, `verify-email/resend/route.ts` (rate-limited, audited).
- `src/auth.ts`: added `/register` and `/verify-email` to the public-path allowlist.

### Pages
- **New** `src/app/(public)/register/` (page + form: name/email/password/confirm + ToS checkbox).
- **New** `src/app/(public)/verify-email/` (page + client: pending / token-action / invalid states + resend).
- `login-form.tsx`: "Need an account? Register" link. `login/page.tsx`: `?verified=1` success banner.

### Settings (email preferences)
- **New** `src/components/settings/notifications-tab.tsx` + PATCH `src/app/api/settings/email-preferences/route.ts`.
- Wired a "Notifications" tab into `settings-content.tsx`; `settings/page.tsx` passes current prefs.

## Verification
- `pnpm lint` (0 errors, 2 pre-existing warnings), `pnpm typecheck` (clean), `pnpm test` (1513 passed / 84 integration skipped), `pnpm build` (clean, all new routes emitted).
- New tests: `tests/unit/auth-email-verification.test.ts` (token helpers, schemas, route-shape security assertions); extended `email.test.ts` (branded layout + category footer); updated `settings-page`, `auth-login-lockout`, `webhook-stripe` tests for the moved email module / new tab.
- **Runtime E2E** against an ephemeral PostgreSQL 16 (no persistent volume) + dev server: data-layer ops (default prefs, token lifecycle, FK cascade, prefs update) all passed; full browser flow via Playwright -- register -> pending page -> "Verify my email" button -> `/login?verified=1` banner -> credentials login -> authenticated app. Token replay returned HTTP 400 (single-use enforced). Branded welcome (product) email fired post-verification.

## Notes / Gotchas
- Email module moved from a single file to `src/lib/email/`; import path `@/lib/email` is unchanged. Source-inspection tests that read `src/lib/email.ts` were repointed to `src/lib/email/{send,index}.ts`.
- Pre-existing dev-only hydration warning appears on every page (global theme/CRT overlay on `<html>`), unrelated to this change.
- Local dev DB is contended: a native host PostgreSQL owns `localhost:5432` (no `tyf` role) and shadows the `track-your-future-postgres-1` container. E2E used an isolated ephemeral container on port 5439; the native host Postgres/Redis were not touched.

## Browser E2E commands (for the normal dev environment)
- Set `EMAIL_DEV_SEND=true` in `.env.local` to receive real verification/reset email via the configured Brevo SMTP; otherwise the dev server logs the email (with the verify link) to its console.
- Flow: `/register` -> submit -> `/verify-email?status=pending` -> open the emailed link -> "Verify my email" -> `/login?verified=1` -> sign in.

## Status
Branch `feat/email-registration-verification`, committed (`feat(auth): add email/password registration with verification and email preferences`). Not yet merged to `main`.
