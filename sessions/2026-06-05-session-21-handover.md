# Session 21 Handover - 2026-06-05

## Summary
Implemented a per-user API token system: a versioned, bearer-authenticated public API under `/api/v1/*` plus a "Developers" settings tab to create and revoke personal tokens. Tokens are scoped (`read` / `write`), tier-capped by count, rate-limited, and audited. Every request is isolated to the token owner's own data and settings, enforced the same way the rest of the app scopes queries by `userId`.

## Key Design Decision
The codebase's only hashing primitive is bcrypt (`src/lib/auth/password.ts`), which salts randomly and therefore cannot be looked up by value. API tokens are high-entropy random secrets, so they are hashed with deterministic SHA-256 (`src/lib/crypto/api-token.ts`) and stored as an indexed unique column. Only the hash is persisted; the plaintext (`tyf_<base64url(32 bytes)>`) is shown to the user exactly once at creation. No new env var is required.

## Changes Made

### Schema
- **New** `src/db/schema/api-tokens.ts` -- `api_tokens` table (id, userId FK cascade, name, tokenHash unique, tokenPrefix, scope, lastUsedAt, expiresAt, revokedAt soft-revoke, createdAt) + `userId` index. Exports `ApiTokenScope`.
- Wired into `src/db/schema/index.ts` and `src/db/schema/relations.ts` (`users -> apiTokens`).
- **New migration** `drizzle/0006_youthful_mad_thinker.sql`. Verified to apply cleanly against a fresh PostgreSQL with the full migration set.

### Crypto + auth
- **New** `src/lib/crypto/api-token.ts` -- `generateApiToken()`, `hashApiToken()`.
- **New** `src/lib/auth/api-token.ts` -- `authenticateApiToken(request)` (parses `Authorization: Bearer`, looks up by hash, rejects revoked/expired, throttled `lastUsedAt` update), plus `tokenCanWrite()`.

### v1 API surface (`src/app/api/v1/*`)
- **New** `src/lib/api/v1/response.ts` (`apiError`/`apiValidationError`/`apiOk`; stable `{ error: { code, message } }` envelope), `with-token.ts` (`withApiToken(scope, handler)` -- bearer auth + per-owner rate limit + scope enforcement), `ai-features.ts` (read-only AI table map).
- Routes (all scoped to the token owner, reusing existing Zod schemas): `applications` (+ `[id]`, `[id]/status`), `roles` (+ `[id]`), `roles/[id]/templates` (+ `[templateId]`, encrypted field values), `documents` (list, `[id]` GET/DELETE, `presign`, `confirm`, `[id]/download`), `notifications` (+ `[id]`), `ai/[feature]` (+ `[itemId]`, read-only), `settings/profile`, `me`.
- Side effects preserved to keep data consistent with the UI: application status history + `detectMilestones`, document version promotion + MinIO cleanup. The v1 `confirm` route additionally rejects file keys not prefixed with the caller's `userId` (defense the UI route lacks).

### Token management (session-authenticated)
- **New** `src/lib/api-tokens/schemas.ts` (`createApiTokenSchema`).
- **New** `src/app/api/settings/api-tokens/route.ts` (GET list active, POST create with count cap + audit + one-time plaintext) and `[tokenId]/route.ts` (DELETE soft-revoke + audit).

### Gating, rate limits, audit
- `src/lib/billing/plans.ts` + `feature-gate.ts`: added `apiTokens` resource (free: 2, pro: unlimited) counting only active tokens.
- `src/lib/rate-limit-configs.ts`: `API_TOKEN_LIMIT` (120/min per owner) and `API_TOKEN_MANAGEMENT_LIMIT` (20/hr, fail-closed).
- `src/db/schema/audit.ts`: added `api_token_created`, `api_token_revoked` actions.

### Settings UI
- **New** `src/components/settings/api-tokens-tab.tsx` -- list active tokens, create form (name/scope/expiry), one-time copy box, two-step revoke.
- Wired a "Developers" tab into `settings-content.tsx` (between Security and Subscription); `settings/page.tsx` fetches the initial active-token list.

## Tests
- **New** `tests/unit/api-token-crypto.test.ts` (token format, SHA-256 determinism), `tests/unit/api-token-resolver.test.ts` (bearer parsing, expiry/revocation, scope, throttled last-used; `@/db` mocked via `vi.hoisted`), `tests/unit/api-tokens-routes.test.ts` (source-string invariants for management + v1 routes + wrapper).
- **New** `tests/integration/api-tokens.test.ts` (DATABASE_URL-guarded): tenant isolation on list, 404 for another tenant's resource, read-vs-write scope (403/201), expired/revoked/no-token -> 401, active-only token cap.
- Updated `tests/unit/settings-page.test.tsx` for the new tab (6 tabs, `apiTokens` prop).

## Verification
- `pnpm lint` -- 0 errors (2 pre-existing warnings unrelated).
- `pnpm typecheck` -- clean.
- `pnpm test` -- 1487 unit passing; integration suite (8 new tests) passing against PostgreSQL.
- `pnpm build` -- clean; all `/api/v1/*` routes registered as dynamic functions.

## Notes / Follow-ups
- The local host has a native PostgreSQL bound to `localhost:5432` that shadows the Docker `tyf-postgres` container; integration tests were validated against a throwaway container on port 5440. For local integration runs, point `DATABASE_URL` at a reachable instance (the host PG on 5432 lacks the `tyf` role).
- Not committed yet -- suggested message: `feat(api): add per-user scoped API token system with /api/v1 surface`.
- Possible future work: per-resource scopes, an OpenAPI/usage doc page, optional document-link (`applicationDocuments`) endpoints, and surfacing `WWW-Authenticate`/`Retry-After` in published API docs.
