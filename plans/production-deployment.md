# Production Docker Deployment Plan

## Overview

Prepare the application for production deployment on a Contabo VPS with Docker Compose, Caddy reverse proxy (automatic SSL), GitHub Actions CI/CD, automated migrations, and demo data seeding.

## Architecture

```
Internet -> Caddy (SSL) -> Next.js App (:3000)
                        -> MinIO (:9000) [presigned URL uploads]
            PostgreSQL (:5432) [internal only]
            Redis (:6379) [internal only]
```

## Implementation Checklist

### Step 1: Standalone Output
- [x] Add `output: 'standalone'` to `next.config.ts`
- Produces self-contained `.next/standalone/` with `server.js` and minimal `node_modules`

### Step 2: Un-gitignore Drizzle Migrations
- [x] Remove `drizzle/` from `.gitignore`
- 3 migration SQL files + meta directory now tracked in repo

### Step 3: Health Check Endpoint
- [x] `src/app/api/health/route.ts`
- GET, no auth required (proxy matcher excludes `/api`)
- Checks PostgreSQL (`SELECT 1`) and Redis (`PING`)
- Returns 200 `{ status: 'healthy' }` or 503 `{ status: 'degraded' }`
- Reports latency per service

### Step 4: Cron Stale Detection Endpoint
- [x] `src/app/api/cron/detect-stale/route.ts`
- GET, authenticated via `Authorization: Bearer <CRON_SECRET>`
- Queries distinct users with non-terminal applications
- Calls existing `detectStaleApps(userId)` per user
- Returns `{ usersProcessed, notificationsCreated, errors }`

### Step 5: Migration Script
- [x] `scripts/migrate.mjs` (plain ESM, no build step)
- Uses `drizzle-orm/postgres-js/migrator` programmatic API
- Single-connection client, clean exit

### Step 6: Seed Script
- [x] `scripts/seed.mjs` (plain ESM, no build step)
- Demo user: `demo@trackyourfuture.app` / `demo-password-2026!`
- Free subscription, 3 role categories, form field templates
- 8 sample applications across statuses with history
- All inserts use `ON CONFLICT DO NOTHING` for idempotency

### Step 7: Docker Entrypoint
- [x] `docker-entrypoint.sh`
- Waits for PostgreSQL readiness (retry loop)
- Runs migrations automatically
- Conditionally seeds if `SEED_ON_INIT=true`
- `exec "$@"` hands off to CMD

### Step 8: Production Dockerfile
- [x] 5-stage build: base, dependencies, development, builder, production
- Production stage uses standalone output (~150MB vs ~800MB)
- Copies drizzle migrations, scripts, required node_modules for scripts
- HEALTHCHECK via wget to `/api/health`
- ENTRYPOINT runs migrations before starting server

### Step 9: Docker Ignore Updates
- [x] Added `.github` to `.dockerignore`
- `scripts/` and `drizzle/` confirmed not excluded

### Step 10: Production Deployment Files
- [x] `deploy/Caddyfile` -- reverse proxy with automatic SSL
- [x] `deploy/docker-compose.prod.yml` -- all services, credentials from env vars
- [x] `deploy/.env.production.example` -- all required env vars documented

### Step 11: GitHub Actions CI/CD
- [x] `.github/workflows/deploy.yml`
- Build job: checkout, GHCR login, buildx with GHA cache, push to GHCR
- Deploy job: SSH to VPS, pull and restart app container

### Step 12: Package.json and Env Updates
- [x] `db:migrate` now runs `node scripts/migrate.mjs`
- [x] `db:migrate:kit` preserved for drizzle-kit migrate
- [x] `db:seed` added
- [x] `CRON_SECRET` added to `.env.example`

## Deployment Steps (First Time)

1. Set up VPS:

| |
|---|
| `mkdir -p /opt/track-your-future`<br>`cd /opt/track-your-future`<br>`cp deploy/docker-compose.prod.yml docker-compose.prod.yml`<br>`cp deploy/Caddyfile Caddyfile`<br>`cp deploy/.env.production.example .env.production` |

2. Edit `.env.production` with real credentials

3. Configure GitHub Secrets:
   - `VPS_HOST` -- server IP
   - `VPS_USER` -- SSH user
   - `VPS_SSH_KEY` -- SSH private key

4. First deployment (with seed):
   - Set `SEED_ON_INIT=true` in `.env.production`
   - Push to main (triggers CI/CD)
   - After first deployment, set `SEED_ON_INIT=false`

5. Set up cron for stale detection:

| |
|---|
| `0 8 * * * curl -s -H "Authorization: Bearer <CRON_SECRET>" https://yourdomain.com/api/cron/detect-stale` |

## File Summary

| Action | File |
|--------|------|
| Edit | `next.config.ts` |
| Edit | `.gitignore` |
| Edit | `.dockerignore` |
| Edit | `package.json` |
| Edit | `.env.example` |
| Rewrite | `Dockerfile` |
| Create | `src/app/api/health/route.ts` |
| Create | `src/app/api/cron/detect-stale/route.ts` |
| Create | `scripts/migrate.mjs` |
| Create | `scripts/seed.mjs` |
| Create | `docker-entrypoint.sh` |
| Create | `deploy/Caddyfile` |
| Create | `deploy/docker-compose.prod.yml` |
| Create | `deploy/.env.production.example` |
| Create | `.github/workflows/deploy.yml` |
| Create | `plans/production-deployment.md` |

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Contabo VPS IP address |
| `VPS_USER` | SSH username |
| `VPS_SSH_KEY` | SSH private key for deployment |

## Notes

- MinIO presigned URLs: `MINIO_ENDPOINT` must be the public hostname for browser uploads
- Caddy handles SSL automatically via Let's Encrypt
- PostgreSQL, Redis, MinIO have no exposed ports in production (internal Docker network only)
- Redis is password-protected in production
- The standalone tracer may not include `drizzle-orm/postgres-js/migrator` since it is never imported in app code -- explicit COPY from dependencies stage ensures availability
