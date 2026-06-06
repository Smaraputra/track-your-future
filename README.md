# Track Your Future

Track Your Future is a multi-tenant SaaS job-application tracking platform, a "job search command center." Users store CVs and cover letters, manage reusable form-field answers, track applications through a status pipeline, and generate AI-powered insights. The interface uses a retro terminal aesthetic. The product is monetized through Free and Pro ($9/month) tiers with billing handled by Stripe or Polar.

## Features

- Authentication with email and password plus Google and GitHub OAuth (NextAuth v5), email verification, password reset, and per-email login lockout.
- Role categories to organize applications, documents, and reusable answers.
- Document storage for CVs and cover letters with versioning, served through presigned object-storage URLs.
- Reusable form-field templates whose values are encrypted at rest (AES-256-GCM).
- Application tracking through a status pipeline with status history and milestone notifications.
- AI suite: CV parsing, job-description extraction, match scoring, cover-letter generation, interview preparation, and resume suggestions, with per-plan usage limits.
- Dashboard, analytics, and in-app notifications.
- Billing with Stripe or Polar, including checkout, trials, and a customer portal. Billing can be disabled to grant all users Pro access.
- A personal API token system exposing a versioned REST API under `/api/v1`. See [API documentation](docs/api-v1.md).
- Security features: Cloudflare Turnstile on all auth forms, per-request CSP nonces, an audit log, rate limiting, and application-level encryption for sensitive columns.

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
| `CRON_SECRET` | No | Shared secret for authenticating scheduled cron requests. |

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

## Conventions

- Commit messages follow Conventional Commits, for example `feat(api): add per-user scoped API token system`.
- Allowed commit types are `feat`, `fix`, `refactor`, `test`, `chore`, and `docs`.
- Every database query is scoped to the authenticated user.
- File uploads always use presigned URLs; binary data is never proxied through the application server.
- AI calls are tracked in the `ai_usage` table and enforce plan limits.

## License

This project is source-available, not open-source. The code is published for viewing, reference, and evaluation only; all rights are reserved and reuse, redistribution, or hosting is not permitted without written permission. See [LICENSE](LICENSE) for the full terms. External contributions are not currently accepted.
