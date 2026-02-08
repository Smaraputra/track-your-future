# Phase 1: Project Scaffold + Docker Infrastructure

## 1.1 Initialize Next.js Project

- `create-next-app@latest` with TypeScript, Tailwind v4, App Router, `src/` directory, pnpm
- ESLint + Prettier configuration
- Path aliases in `tsconfig.json` (`@/*` -> `./src/*`)

### Acceptance Criteria

- `pnpm build` succeeds with zero errors
- `pnpm lint` passes
- Dev server starts on port 3000
- `.env.example` with all expected variables
- `.prettierrc` configured

## 1.2 Docker Compose

| Service | Image | Ports | Notes |
|---------|-------|-------|-------|
| `app` | Custom Dockerfile (node:20-alpine, multi-stage) | 3000 | Bind mount `./src` for dev hot reload |
| `postgres` | postgres:16-alpine | 5432 | Named volume `postgres_data` |
| `minio` | minio/minio:latest | 9000, 9001 | Named volume `minio_data`, console on 9001 |
| `minio-init` | minio/mc:latest | - | Creates bucket `tyf-documents`, exits |
| `redis` | redis:7-alpine | 6379 | Rate limiting + AI result caching (dev) |

### Acceptance Criteria

- `docker compose up -d` starts all services healthy
- PostgreSQL accessible on localhost:5432
- MinIO console accessible on localhost:9001
- Redis accessible on localhost:6379
- `tyf-documents` bucket auto-created on first start
- Named volumes persist data between restarts

## 1.3 Drizzle ORM Setup

- Install `drizzle-orm`, `drizzle-kit`, `postgres` driver
- `src/db/index.ts` -- connection singleton (reuse across hot reloads)
- `drizzle.config.ts` -- migration config pointing to `src/db/schema/`
- Schema directory: `src/db/schema/`

### Acceptance Criteria

- `pnpm drizzle-kit generate` produces migration SQL
- `pnpm drizzle-kit push` applies schema to running PostgreSQL
- Connection singleton prevents multiple connections in dev

## Status

- [x] 1.1 Next.js initialized (Next.js 16.1.6, Tailwind v4, pnpm, Prettier)
- [x] 1.2 Docker Compose
- [x] 1.3 Drizzle ORM setup
