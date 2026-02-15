# Tracked Your Future -- Shipping Checklist

**Status**: Feature-complete (26/26 steps), 1299+ tests passing, clean builds.
**Production readiness**: ~75% -- code is solid, infrastructure and ops tooling missing.
**Estimated effort**: 5-7 days to production.

---

## 1. Third-Party Accounts to Create

### Required

| Service | Purpose | What You Need |
|---------|---------|---------------|
| **Vercel** (or hosting provider) | App hosting | Account + project linked to GitHub repo |
| **Neon** or **Supabase** | Managed PostgreSQL | Connection string with pooling enabled |
| **Upstash** | Managed Redis (serverless) | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| **AWS S3** (or Cloudflare R2) | Document storage | Bucket, IAM credentials, CORS policy |
| **Stripe** (live mode) | Billing | Live secret key, publishable key, webhook secret, price IDs |
| **SendGrid** / **Postmark** / **AWS SES** | Transactional email | SMTP credentials or API key |
| **Google Cloud Console** | Google OAuth | OAuth 2.0 client ID + secret (production redirect URIs) |
| **GitHub OAuth Apps** | GitHub OAuth | Client ID + secret (production callback URL) |
| **Domain registrar** | Custom domain | Domain name, DNS access |

### Recommended

| Service | Purpose | What You Need |
|---------|---------|---------------|
| **Sentry** | Error tracking | DSN |
| **Plausible** / **PostHog** | Analytics | Script tag or SDK key |
| **UptimeRobot** / **Better Stack** | Uptime monitoring | Webhook or email alerts |
| **Cloudflare** | CDN + DNS + SSL | Nameservers pointed |

---

## 2. Environment Variables to Configure

### Critical (app will not work without these)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/track_your_future?sslmode=require

# Auth
AUTH_URL=https://yourdomain.com
AUTH_SECRET=                    # openssl rand -base64 32

# Stripe (live mode)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PRO_ANNUAL_PRICE_ID=price_...

# Document Storage (S3)
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_ACCESS_KEY=AKIA...
MINIO_SECRET_KEY=...
MINIO_BUCKET=tyf-documents
MINIO_USE_SSL=true

# Redis
REDIS_URL=redis://...
# or Upstash:
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG....
EMAIL_FROM=noreply@yourdomain.com
```

### Optional (features degrade gracefully without these)

```env
# OAuth providers
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...

# AI (needed for AI features only)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# Monitoring
SENTRY_DSN=https://...
NEXT_PUBLIC_ANALYTICS_ID=...
```

### Missing from .env.example (add these)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CRON_SECRET=                   # openssl rand -hex 32
```

---

## 3. Code Changes Before Deploy

### SEO (missing entirely)

- [ ] Add `metadataBase` to `src/app/layout.tsx` (`new URL('https://yourdomain.com')`)
- [ ] Create `src/app/robots.ts` (allow all, link sitemap)
- [ ] Create `src/app/sitemap.ts` (public routes: /, /login, /register, /pricing, /privacy, /terms)
- [ ] Add OpenGraph image -- either static `src/app/opengraph-image.png` (1200x630) or dynamic via `opengraph-image.tsx`
- [ ] Add per-page metadata to key pages (pricing, login, register)

### Security Headers

- [ ] Add security headers in `next.config.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (camera=(), microphone=(), geolocation=())
  - Content Security Policy (start with report-only)

### Cron Jobs

- [ ] Create `vercel.json` with cron config for stale detection:
  ```json
  {
    "crons": [{
      "path": "/api/notifications/detect-stale",
      "schedule": "0 8 * * *"
    }]
  }
  ```
- [ ] Add `CRON_SECRET` check to `/api/notifications/detect-stale` route (verify `Authorization: Bearer <CRON_SECRET>` header)

### S3/MinIO CORS

- [ ] Restrict S3 CORS from `*` to production domain only
- [ ] Add lifecycle policy: delete incomplete multipart uploads after 24h

### Error Tracking

- [ ] Install Sentry: `pnpm add @sentry/nextjs`
- [ ] Create `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [ ] Wrap `next.config.ts` with `withSentryConfig()`
- [ ] Add `SENTRY_DSN` to env

### README

- [ ] Replace default Next.js README with project description, setup instructions, and deployment guide

---

## 4. Infrastructure Setup

### If Deploying to Vercel (recommended path)

1. **Connect repo** -- Link GitHub repo to Vercel project
2. **Set env vars** -- Add all variables from Section 2 in Vercel dashboard
3. **Database** -- Provision Neon PostgreSQL (free tier: 0.5GB, 190 hours/mo)
   - Run `pnpm db:migrate` against production DB
   - No seed script exists -- first user registers normally
4. **Redis** -- Add Upstash integration from Vercel marketplace
5. **S3 bucket** -- Create in AWS console:
   - Region: same as your Vercel region
   - Block public access: ON
   - CORS: allow PUT from production domain
   - IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on bucket
6. **Stripe webhook** -- Register `https://yourdomain.com/api/webhooks/stripe` in Stripe dashboard
   - Events to listen for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
7. **OAuth callbacks** -- Register in Google/GitHub:
   - Google: `https://yourdomain.com/api/auth/callback/google`
   - GitHub: `https://yourdomain.com/api/auth/callback/github`
8. **Email DNS** -- Add SPF, DKIM, DMARC records for sender domain
9. **Custom domain** -- Add domain in Vercel, update DNS (A/CNAME records)

### If Deploying to VPS (Docker) -- Current Setup

The production compose stack (`deploy/docker-compose.prod.yml`) is designed for shared VPS hosting:

- App binds to `127.0.0.1:${APP_PORT:-3100}` (loopback only, not exposed to the internet)
- No bundled reverse proxy -- uses the host's existing Caddy/nginx
- All backing services (PostgreSQL, Redis, MinIO) are internal to the Docker network
- See `deploy/Caddyfile` for the host-level reverse proxy snippet

**Setup steps:**

1. **Provision server** -- DigitalOcean/Hetzner, 2+ vCPU, 4GB RAM
2. **Install Docker** + Docker Compose
3. **Clone deploy files** to `/opt/track-your-future`:
   - `docker-compose.prod.yml`, `.env.production`, `docker-entrypoint.sh`
4. **Set `APP_PORT`** in `.env.production` to an unused port (default: 3100)
5. **Add reverse proxy rule** to host Caddy/nginx:
   - Caddy: add block from `deploy/Caddyfile` to `/etc/caddy/Caddyfile`
   - nginx: `proxy_pass http://127.0.0.1:3100;` with appropriate headers
6. **SSL** -- Handled by host Caddy (auto HTTPS) or certbot
7. **PostgreSQL** -- Self-hosted in Docker with persistent volume, daily pg_dump backup
8. **Redis** -- Self-hosted in Docker with `maxmemory` and `volatile-lru` eviction
9. **MinIO** -- Self-hosted in Docker with persistent volume (internal only, presigned URLs routed through the app)
10. **Cron** -- System crontab: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3100/api/cron/detect-stale`

---

## 5. CI/CD Pipeline (Missing)

### GitHub Actions (recommended)

Create `.github/workflows/ci.yml`:

- [ ] **On PR**: lint, typecheck, test (unit), build
- [ ] **On merge to main**: deploy to staging
- [ ] **On release tag**: deploy to production
- [ ] **Scheduled**: daily E2E tests against staging

Required secrets in GitHub:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (if Vercel)
- `DATABASE_URL` (test database for CI)
- All other env vars for integration tests

---

## 6. Pre-Launch Testing

### Staging Environment

- [ ] Deploy to staging with production-like config
- [ ] Test complete registration flow (credentials + OAuth)
- [ ] Test email delivery (verification, password reset)
- [ ] Test Stripe checkout (use test mode with test cards)
- [ ] Test document upload/download
- [ ] Test AI features with real API keys (small test)
- [ ] Run E2E suite against staging
- [ ] Test on mobile (responsive design check)
- [ ] Test both themes (green + amber)

### Security Checks

- [ ] Run OWASP ZAP scan against staging
- [ ] Verify all API routes require authentication (except public ones)
- [ ] Verify multi-tenancy: user A cannot access user B's data
- [ ] Verify rate limiting on auth endpoints
- [ ] Verify Stripe webhook signature verification
- [ ] Check that .env files are in .gitignore
- [ ] Verify no secrets in client-side bundle (`NEXT_PUBLIC_` prefix audit)

### Performance

- [ ] Run Lighthouse on key pages (target 90+ performance score)
- [ ] Check initial bundle size (`pnpm build` output)
- [ ] Verify database queries have appropriate indexes
- [ ] Test under load (optional: k6 or artillery)

---

## 7. Post-Launch

### Day 1

- [ ] Monitor Sentry for errors
- [ ] Monitor Vercel/server logs
- [ ] Verify cron job executed
- [ ] Check Stripe webhook delivery status
- [ ] Verify email deliverability (check spam folders)

### Week 1

- [ ] Set up automated database backups (daily, 30-day retention)
- [ ] Configure uptime monitoring alerts
- [ ] Set AI provider spending alerts ($50/mo cap to start)
- [ ] Review Sentry error trends
- [ ] Check S3 storage usage

### Ongoing

- [ ] Dependency updates (Dependabot or Renovate)
- [ ] Database migration testing in staging before production
- [ ] Monitor Stripe failed payments and churn
- [ ] Review AI usage costs monthly
- [ ] Rotate secrets quarterly (AUTH_SECRET, API keys)

---

## 8. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| DB connection pool exhaustion | App crashes under load | Use connection pooler (Neon has built-in, or PgBouncer) |
| Redis memory overflow | Rate limiting + cache break | Set `maxmemory` policy, monitor usage |
| Orphaned S3 files | Storage cost creep | S3 lifecycle policy: delete unconfirmed uploads after 24h |
| AI API cost runaway | Unexpected bills | Plan limits enforced in code + provider spending alerts |
| Email lands in spam | Users can't verify/reset | SPF/DKIM/DMARC records, warm-up sender reputation |
| Cron job not running | Stale notifications never fire | Monitor cron execution, alert if no run in 25h |
| OAuth callback mismatch | Login fails in production | Register exact callback URLs, test in staging first |
| No DB backups | Data loss on failure | Enable managed DB auto-backups, test restore |

---

## 9. What Already Works

The following are complete and production-ready:

- 18-table database schema with migrations
- JWT auth (credentials + Google + GitHub OAuth)
- Stripe billing (checkout, portal, webhooks, plan enforcement)
- Document upload via presigned URLs (S3-compatible)
- 6 AI features (CV parsing, JD extraction, match scoring, cover letter, interview prep, resume suggestions)
- Full application tracking CRUD with status pipeline
- Role categories + form field templates
- Dashboard with stats, activity feed, analytics charts
- Notification system with stale detection
- 4-step onboarding wizard
- Settings (profile, security, appearance, subscription, data export/delete)
- Retro terminal UI with two themes
- Cookie consent + GDPR compliance (export, delete)
- Error boundaries + loading states + 404 pages
- 1415 unit/integration tests, 52 E2E tests
- Multi-stage Dockerfile
- Zero TODO comments in codebase
