# Session 23 Handover - 2026-06-06

## Summary
Added Cloudflare Turnstile bot protection in front of every public auth form, protecting the email-sending and brute-force-prone endpoints built in session 22. Covers all six: register, login, forgot-password, verify-email (resend + token confirm), and reset-password confirm. Each form renders a Turnstile widget; each endpoint verifies the token server-side via Cloudflare siteverify before any DB/email work. Built on branch `feat/email-registration-verification` (same PR #1 as the email system).

## Key Design Decisions
- **strict-dynamic CSP -> nonce the script.** `src/lib/security/csp.ts` uses `script-src 'self' 'nonce-...' 'strict-dynamic'`, under which a `challenges.cloudflare.com` host entry is ignored. The Turnstile script is trusted via the per-request nonce instead: server-component pages read `x-nonce` (set by `src/proxy.ts`, consumed in `src/app/layout.tsx`) and pass it to the form, which hands it to `@marsidev/react-turnstile` via `scriptOptions={{ nonce }}`. `challenges.cloudflare.com` added to `frame-src` + `connect-src` (and `script-src` as a legacy fallback). Verified e2e: the script loads with no CSP violation.
- **No build-time NEXT_PUBLIC_.** The public site key is read at request time via `getTurnstileSiteKey()` in the server-component pages and passed to the client forms as a prop (this repo deliberately avoids webpack env inlining).
- **Env-presence gating.** `verifyTurnstile` returns success when no secret is configured (dev/tests stay green); enforced only when `TURNSTILE_SECRET_KEY` is set. Network/parse errors fail closed. Production must set both keys.
- **Widget reset via remount key, not a ref.** React 19's `react-hooks/refs` rule forbids reading `ref.current` inside a submit handler passed to `handleSubmit`. Forms reset the widget by bumping a `key` prop (`setTurnstileKey`) instead of an imperative `reset()` ref.
- **Login threads the token through NextAuth.** Added a `turnstileToken` credential; `authorize` (`src/auth.ts`) verifies it first (before lockout/db/password) and throws a `CredentialsSignin` subclass with `code = 'turnstile_failed'`; the login page maps that code and also reads `?code=` from the URL.

## Changes Made
- **New** `src/lib/turnstile.ts`: `verifyTurnstile(token, ip?)` (siteverify POST), `getTurnstileSiteKey/SecretKey`, `isTurnstileEnabled`. Mirrors `src/lib/rate-limit.ts` style; db-free.
- **New** `src/components/auth/turnstile-widget.tsx`: client wrapper over `@marsidev/react-turnstile@1.5.2`; renders nothing without a site key; `theme: 'dark'`, nonce via `scriptOptions`.
- `src/lib/security/csp.ts`: added `https://challenges.cloudflare.com` to `script-src`/`frame-src`/`connect-src`.
- 5 pages (register/login/forgot-password/reset-password/verify-email): read `x-nonce` + site key, pass to forms.
- 5 forms: render the widget, hold a `turnstileToken` + `turnstileKey`, require the token when enabled, include it in the request body (login via `signIn`), reset on failure.
- 5 API routes verify the token after the rate-limit check and before any work; `src/auth.ts` verifies in `authorize`.
- `.env.example`: `# Cloudflare Turnstile` section with `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` and the Cloudflare dev/test keys.
- Dependency: `@marsidev/react-turnstile` (React 19 compatible; no peer issues).

## Verification
- `pnpm lint` (0 errors), `pnpm typecheck` (clean), `pnpm test` (**1529 passed** / 84 integration skipped), `pnpm build` (clean).
- New `tests/unit/turnstile.test.ts` (16 tests): `verifyTurnstile` disabled/success/reject/missing-token/network-fail-closed; env helpers; CSP contains `challenges.cloudflare.com` in `frame-src`/`connect-src` and keeps nonce+strict-dynamic; route-shape assertions that all 6 endpoints + `authorize` call `verifyTurnstile`. Updated `login-form.test.tsx` (signIn now sends `turnstileToken`).
- **Browser E2E** against an ephemeral PostgreSQL + dev server with Cloudflare **test keys**: register page loaded the Turnstile script under the strict-dynamic CSP with **no CSP violation** (only the pre-existing theme-nonce hydration warning and a benign Cloudflare preload notice); the widget issued a token; submitting created the user and redirected to the pending verify page (full chain incl. real siteverify). With the **always-block** secret, `POST /api/auth/register` returned **HTTP 400 "Verification failed."** and created **no** user.

## Notes / Gotchas
- `react-hooks/refs` (React 19): don't read `ref.current` in a handler passed to `handleSubmit`; reset child widgets via a `key` remount instead.
- The Turnstile widget renders a cross-origin iframe, so it doesn't appear in Playwright's a11y snapshot; confirm it via the `cf-turnstile-response` hidden input value and the `challenges.cloudflare.com` script/network activity.
- Pre-existing dev-only hydration warning on the theme script's nonce (server `nonce=...` vs client `nonce=""`) is unrelated to Turnstile.

## Deploy checklist
- Create a Turnstile widget in the Cloudflare dashboard for `trackedyourfuture.com`; set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` on the server `.env`. Until both are set, Turnstile is inert (widget hidden, verification skipped) -- so production must set them for the protection to be active.

## Status
Branch `feat/email-registration-verification`, committed (`feat(security): add Cloudflare Turnstile to all public auth forms`). Folds into open PR #1. Not yet merged.
