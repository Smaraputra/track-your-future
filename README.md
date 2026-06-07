<div align="center">

<img src="public/logo.png" alt="Track Your Future" width="96" height="96" />

# Track Your Future

**Your job-search command center.** Track every application, store your CVs and reusable answers, and get AI-powered insights, all wrapped in a retro terminal UI.

[Live Demo](https://trackedyourfuture.com) &nbsp;&middot;&nbsp; [Features](#features) &nbsp;&middot;&nbsp; [Screenshots](#screenshots) &nbsp;&middot;&nbsp; [Tech Stack](#tech-stack) &nbsp;&middot;&nbsp; [Getting Started](#getting-started) &nbsp;&middot;&nbsp; [API](#api) &nbsp;&middot;&nbsp; [License](#license)

![Version](https://img.shields.io/badge/version-1.0.0-22c55e?style=flat-square)
![License](https://img.shields.io/badge/license-source--available-f59e0b?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-1400%2B%20passing-22c55e?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/Smaraputra/track-your-future?style=flat-square)

<img src="docs/assets/dashboard.png" alt="Track Your Future dashboard" width="100%" />

</div>

## Live demo

Try it without installing anything at **[trackedyourfuture.com](https://trackedyourfuture.com)**. A shared demo account is preloaded with sample applications, documents, and AI results, with all Pro features unlocked.

| Field | Value |
|-------|-------|
| URL | https://trackedyourfuture.com/login |
| Email | `demo@trackedyourfuture.com` |
| Password | `demo-explore-2026` |

The demo account is shared and periodically reset, so treat it as a sandbox.

## About

Job searching scatters your life across spreadsheets, note apps, and a dozen browser tabs. Track Your Future pulls it into one place: a command center where every application has a status, every CV and cover letter has a home, and an AI layer reads job descriptions to tell you how well you match and what to fix. It is a full multi-tenant SaaS, with authentication, billing, an object store, and a public API, presented through a deliberately retro terminal aesthetic with green and amber themes.

## Features

- **Application pipeline.** Track every application through a status pipeline (draft, applied, phone screen, interview, offer, rejected, ghosted, withdrawn) with full status history and milestone notifications.
- **AI suite.** CV parsing, job-description extraction, match scoring, cover-letter generation, interview preparation, and resume suggestions, each with per-plan usage limits.
- **Documents.** Store CVs and cover letters with versioning, served through presigned object-storage URLs so binaries never proxy through the app.
- **Roles and reusable answers.** Organize everything by role category, and keep reusable form-field answers that are encrypted at rest (AES-256-GCM).
- **Analytics.** Status distribution, a conversion funnel, and per-role breakdowns.
- **Auth and security.** Email and password plus Google and GitHub OAuth (NextAuth v5), email verification, password reset, per-email login lockout, Cloudflare Turnstile, per-request CSP nonces, an audit log, and rate limiting.
- **Billing.** Free and Pro ($9/mo) tiers via Stripe or Polar, with checkout, trials, and a customer portal. Billing can be disabled to grant everyone Pro access.
- **Public API.** A versioned REST API under `/api/v1`, authenticated with scoped personal API tokens.
- **Retro UI.** Green and amber terminal themes with an optional CRT scanline overlay, plus full GDPR cookie consent and data export and deletion.

### Application pipeline

<img src="docs/assets/applications.png" alt="Application pipeline board" width="100%" />

### AI insights

Score how well your profile matches a job, see strengths and gaps, and generate tailored cover letters in different tones.

<img src="docs/assets/ai-insights.png" alt="AI match score and cover letter generation" width="100%" />

### Analytics

<img src="docs/assets/analytics.png" alt="Analytics: status distribution and conversion funnel" width="100%" />

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/assets/landing-green.jpg" alt="Landing page, green theme" /><br/><sub>Landing, green theme</sub></td>
    <td width="50%"><img src="docs/assets/landing-amber.jpg" alt="Landing page, amber theme" /><br/><sub>Landing, amber theme</sub></td>
  </tr>
  <tr>
    <td><img src="docs/assets/application-detail.png" alt="Application detail" /><br/><sub>Application detail</sub></td>
    <td><img src="docs/assets/documents.png" alt="Documents" /><br/><sub>Documents</sub></td>
  </tr>
  <tr>
    <td><img src="docs/assets/roles.png" alt="Role categories" /><br/><sub>Role categories</sub></td>
    <td><img src="docs/assets/settings.png" alt="Settings" /><br/><sub>Settings and themes</sub></td>
  </tr>
</table>

<details>
<summary>Mobile views</summary>

<table>
  <tr>
    <td width="50%"><img src="docs/assets/landing-mobile.jpg" alt="Landing on mobile" /><br/><sub>Landing</sub></td>
    <td width="50%"><img src="docs/assets/dashboard-mobile.png" alt="Dashboard on mobile" /><br/><sub>Dashboard</sub></td>
  </tr>
</table>

</details>

## Tech stack

| Area | Technology |
|------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Authentication | NextAuth.js v5 (credentials, Google, GitHub) |
| Database | PostgreSQL 16 with Drizzle ORM |
| File storage | MinIO (S3-compatible), presigned URL uploads |
| Cache | Redis 7 (rate limiting and AI result caching) |
| AI | Vercel AI SDK (OpenAI, Mistral) |
| Billing | Stripe or Polar |
| UI | shadcn/ui restyled as a retro terminal, Tailwind CSS v4 |
| Validation | Zod |
| Forms | react-hook-form with @hookform/resolvers |
| Charts | Recharts |
| Package manager | pnpm |

## Architecture

| |
|---|
| `src/`<br>`  app/                 Next.js App Router pages and API routes`<br>`    (public)/          Landing, auth pages, legal, pricing`<br>`    (dashboard)/       Authenticated app (sidebar + header layout)`<br>`    api/               API routes (auth, checkout, webhooks, documents, ai, settings, v1)`<br>`  components/           React components (retro UI system)`<br>`  db/                   Drizzle ORM (connection, schema, migrations)`<br>`  lib/                  Server utilities (auth, billing, ai, minio, email, crypto)`<br>`  hooks/                Custom React hooks`<br>`  types/                TypeScript type definitions`<br>`drizzle/                Generated SQL migrations (committed)`<br>`docs/                   Documentation`<br>`tests/                  unit, integration, and e2e tests` |

Multi-tenancy is enforced by scoping every database query to `session.user.id` (or, for the API, the token owner's user id).

## Prerequisites

- Node.js 20 or newer (the project is developed on Node 24).
- pnpm, enabled through Corepack.
- Docker and Docker Compose, for PostgreSQL, MinIO, and Redis.

If pnpm is not yet available:

| |
|---|
| `corepack enable`<br>`corepack prepare pnpm@latest --activate` |

## Getting started

This project is source-available; the steps below are for running it locally to inspect and evaluate the code (see [License](#license)).

Clone the repository and install dependencies:

| |
|---|
| `pnpm install` |

Create a local environment file and fill in the required values (see [Environment variables](#environment-variables)):

| |
|---|
| `cp .env.example .env.local` |

Start the backing services (PostgreSQL, MinIO, Redis, and the one-shot MinIO bucket initializer):

| |
|---|
| `docker compose up -d` |

Apply database migrations:

| |
|---|
| `pnpm db:migrate` |

Optionally seed development data:

| |
|---|
| `pnpm db:seed` |

Start the development server. Port 3001 is recommended locally to avoid conflicts, and matches the default `AUTH_URL` in `.env.example`:

| |
|---|
| `PORT=3001 pnpm dev` |

The application is then available at `http://localhost:3001`.

## Environment variables

Copy `.env.example` to `.env.local` and provide values. The most important variables are listed below.

<details>
<summary>Environment variable reference</summary>

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `AUTH_URL` | Yes | Base URL of the application (for example `http://localhost:3001`). |
| `AUTH_SECRET` | Yes | NextAuth session secret. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | No | Google OAuth credentials. |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | No | GitHub OAuth credentials. |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_USE_SSL` | Yes | Object-storage connection and bucket. |
| `REDIS_URL` | Yes | Redis connection string. |
| `DATA_ENCRYPTION_KEY` | Yes | Base64 key that must decode to exactly 32 bytes, used to encrypt sensitive columns. |
| `BILLING_DISABLED` | No | When `true`, all users receive Pro access and billing is skipped. |
| `BILLING_PROVIDER` | No | `stripe` or `polar`. Ignored when billing is disabled. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` | Conditional | Required when `BILLING_PROVIDER` is `stripe`. |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_PRODUCT_MONTHLY`, `POLAR_PRODUCT_ANNUAL` | Conditional | Required when `BILLING_PROVIDER` is `polar`. |
| `OPENAI_API_KEY`, `MISTRAL_API_KEY` | Conditional | At least one AI provider key is required to use AI features. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `CONTACT_EMAIL` | No | Email delivery configuration. |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | No | Cloudflare Turnstile. When unset, the challenge is disabled. |
| `CRON_SECRET` | No | Shared secret for authenticating scheduled cron requests. |

</details>

Generate a value for `DATA_ENCRYPTION_KEY` with:

| |
|---|
| `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

Rotating `DATA_ENCRYPTION_KEY` requires re-encrypting every affected row; plan changes accordingly.

## Available scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start the development server. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Run the production server. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Run the TypeScript compiler with no emit. |
| `pnpm test` | Run the Vitest unit and integration suites. |
| `pnpm test:e2e` | Run the Playwright end-to-end tests. |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes. |
| `pnpm db:migrate` | Apply pending migrations. |
| `pnpm db:push` | Push the schema directly to the database (development convenience). |
| `pnpm db:studio` | Open Drizzle Studio. |
| `pnpm db:seed` | Seed development data. |

## Database and migrations

The schema is defined with Drizzle ORM under `src/db/schema`. Migrations are generated into the `drizzle/` directory and committed to the repository.

After changing the schema, generate and review a migration, then apply it:

| |
|---|
| `pnpm db:generate`<br>`pnpm db:migrate` |

In deployment, migrations are applied automatically on container start. Always generate migrations locally, commit them, and let the deployment apply them.

## Testing

The project uses Vitest for unit and integration tests and Playwright for end-to-end tests.

Unit tests run without external services:

| |
|---|
| `pnpm test` |

Integration tests are guarded and only run when a database is available. Provide a reachable `DATABASE_URL`:

| |
|---|
| `DATABASE_URL=postgresql://tyf:tyf_dev_password@localhost:5432/track_your_future pnpm test` |

Before committing, the project convention is to run the full check sequence and ensure each step is clean:

| |
|---|
| `pnpm lint`<br>`pnpm typecheck`<br>`pnpm test`<br>`pnpm build` |

## API

The application exposes a versioned REST API under `/api/v1`, authenticated with personal API tokens that a user creates in `Settings > Developers`. Tokens are scoped (`read` or `write`) and grant access only to the owning user's data.

Full reference, including authentication, scopes, rate limits, error formats, and every endpoint, is available in [docs/api-v1.md](docs/api-v1.md).

## Plan limits

| Resource | Free | Pro |
|----------|------|-----|
| Applications | 25 | Unlimited |
| Documents | 10 | Unlimited |
| Role categories | 3 | Unlimited |
| Form-field templates | 20 | Unlimited |
| Storage | 50 MB | 200 MB |
| API tokens | 2 | Unlimited |

AI features additionally enforce per-feature monthly usage limits by plan.

## Deployment

The application is deployed to a self-hosted Linux VPS (Ubuntu), behind a Caddy reverse proxy that terminates TLS. Services run under Docker Compose: the Next.js application (standalone build), PostgreSQL, MinIO, and Redis.

Continuous deployment is handled by a GitHub Actions workflow that runs on pushes to `main`. The workflow connects to the server over SSH, pulls the latest code, rebuilds and restarts the containers, and prunes unused images. On startup the application container waits for PostgreSQL, applies pending migrations, and starts the server.

## Project status

Version 1.0.0, feature-complete across 26 build steps, backed by 1400+ unit and integration tests plus an end-to-end Playwright suite. See [CHANGELOG.md](CHANGELOG.md) for release history.

## Conventions

- Commit messages follow Conventional Commits, for example `feat(api): add per-user scoped API token system`.
- Allowed commit types are `feat`, `fix`, `refactor`, `test`, `chore`, and `docs`.
- Every database query is scoped to the authenticated user.
- File uploads always use presigned URLs; binary data is never proxied through the application server.
- AI calls are tracked in the `ai_usage` table and enforce plan limits.

## Contributing

This project is source-available and does not currently accept external contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for details, and [SECURITY.md](SECURITY.md) for how to report security issues.

## License

This project is source-available, not open-source. The code is published for viewing, reference, and evaluation only; all rights are reserved and reuse, redistribution, or hosting is not permitted without written permission. See [LICENSE](LICENSE) for the full terms. External contributions are not currently accepted.
