# Session 20 Handover - 2026-02-16

## Summary
Security audit remediation implementing 10 fixes across P0 (critical) and P1 (short-term) priorities. All P0 and P1 items from the security audit plan are complete. P2 items (session security stamp, Origin checking, CSP nonces) deferred to future work.

## Changes Made

### P0 Fixes (Critical)

#### P0-1: IDOR fix in status update transaction
- **File**: `src/app/api/applications/[applicationId]/status/route.ts`
- Added `eq(applications.userId, session.user.id)` to the UPDATE WHERE clause inside the transaction
- Previously, the ownership check was only in the SELECT before the transaction, but the actual UPDATE could theoretically modify any application by ID

#### P0-2: Polar webhook secret validation
- **File**: `src/app/api/webhooks/polar/route.ts`
- Returns 503 when `POLAR_WEBHOOK_SECRET` env var is not set
- Previously defaulted to empty string, which would produce a predictable HMAC key

#### P0-3: Security headers
- **File**: `next.config.ts`
- Added 7 security headers applied to all routes via `headers()`:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
  - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  - Content-Security-Policy: self + unsafe-inline/eval (Next.js needs these) + Stripe + Polar + Google Fonts

### P1 Fixes (Short-Term)

#### P1-1: Rate limiting on 12 critical endpoints
- **New file**: `src/lib/rate-limit-configs.ts` -- centralized rate limit configs
- Applied to: change-password (5/15min), account-delete (3/1hr), checkout (10/15min), trial (3/1hr), presign (30/1min), export (3/1hr), all 6 AI routes (10/1min shared key)
- Each returns 429 with `Retry-After` header when exceeded

#### P1-2: failClosed option in rate limiter
- **File**: `src/lib/rate-limit.ts`
- Added `failClosed?: boolean` to `RateLimitConfig`
- When true, blocks requests if Redis is unavailable or throws
- Enabled for PASSWORD_CHANGE and ACCOUNT_DELETE only

#### P1-3: Timing-safe cron secret comparison
- **File**: `src/app/api/cron/detect-stale/route.ts`
- Replaced `!==` string comparison with `crypto.timingSafeEqual()`
- Added length check before `timingSafeEqual` (it throws on mismatched lengths)

#### P1-4: Fix IP extraction
- **File**: `src/lib/auth/get-ip.ts`
- Changed from `split(',')[0]` (leftmost, attacker-controlled) to `parts[parts.length - 1]` (rightmost, set by trusted reverse proxy)
- Added documentation comment about deployment assumption

#### P1-5: Validate enum query params
- **Files**: `src/app/api/applications/route.ts`, `src/app/api/documents/route.ts`
- Replaced `as never` casts with explicit validation against `applicationStatusEnum.enumValues` / `documentTypeEnum.enumValues`
- Returns 400 for invalid values

#### P1-6: Restrict health endpoint
- **File**: `src/app/api/health/route.ts`
- Removed `checks` object (latency details per service), `timestamp`, and `not_configured` status
- Returns only `{ status: "healthy" | "degraded" }` with 200/503

## Tests

### New test file
- `tests/unit/security-audit.test.ts` -- 45 tests covering all 10 fixes

### Updated test files
- `tests/unit/health-route.test.ts` -- rewritten to match stripped-down health endpoint
- `tests/unit/cron-detect-stale.test.ts` -- updated to verify `timingSafeEqual` usage
- `tests/unit/webhook-polar.test.ts` -- updated to verify 503 on missing secret

## Verification

| Check | Result |
|-------|--------|
| `pnpm lint` | Pass (0 errors, 1 pre-existing warning) |
| `pnpm typecheck` | Pass (0 errors) |
| `pnpm test` | 1372 passed, 76 skipped |
| `pnpm build` | Clean (65 routes) |

## Test Counts
- Unit tests: 1372 passing (was 1330, +42 new security tests)
- Integration tests: 76 skipped (no DATABASE_URL)

## Files Modified
- `src/app/api/applications/[applicationId]/status/route.ts` -- userId in WHERE
- `src/app/api/webhooks/polar/route.ts` -- secret validation
- `next.config.ts` -- security headers
- `src/lib/rate-limit.ts` -- failClosed option
- `src/lib/rate-limit-configs.ts` -- NEW: centralized configs
- `src/app/api/settings/change-password/route.ts` -- rate limit
- `src/app/api/settings/account/route.ts` -- rate limit
- `src/app/api/checkout/route.ts` -- rate limit
- `src/app/api/billing/trial/route.ts` -- rate limit
- `src/app/api/documents/presign/route.ts` -- rate limit
- `src/app/api/settings/export/route.ts` -- rate limit
- `src/app/api/ai/parse-cv/route.ts` -- rate limit
- `src/app/api/ai/extract-jd/route.ts` -- rate limit
- `src/app/api/ai/match/route.ts` -- rate limit
- `src/app/api/ai/cover-letter/route.ts` -- rate limit
- `src/app/api/ai/interview-prep/route.ts` -- rate limit
- `src/app/api/ai/resume-suggestions/route.ts` -- rate limit
- `src/app/api/cron/detect-stale/route.ts` -- timing-safe compare
- `src/lib/auth/get-ip.ts` -- rightmost IP
- `src/app/api/applications/route.ts` -- enum validation
- `src/app/api/documents/route.ts` -- enum validation
- `src/app/api/health/route.ts` -- stripped response
- `tests/unit/security-audit.test.ts` -- NEW: 45 security tests
- `tests/unit/health-route.test.ts` -- updated
- `tests/unit/cron-detect-stale.test.ts` -- updated
- `tests/unit/webhook-polar.test.ts` -- updated

## P2 Deferred Items
1. Session security stamp (DB migration needed)
2. Origin header checking (CSRF defense-in-depth)
3. CSP nonces (replace unsafe-inline in production)
4. Auth route lint check (CI grep)

## Next Steps
- Commit changes
- Manual verification with dev server (CSP doesn't break pages, Stripe checkout works)
- E2E tests with Playwright
- Production deployment setup
