# Base stage: Node.js with pnpm
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage: install all dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Development stage: for local dev with hot reload
FROM dependencies AS development
COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# Builder stage: build the production app
FROM dependencies AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dummy DATABASE_URL so Next.js page data collection doesn't throw
# (the db module validates the env var exists at import time; no actual connection is made during build)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN pnpm build

# Production stage: minimal image for deployment
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy migration and seed infrastructure
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts ./scripts

# Copy packages needed by scripts (standalone tracer won't include these)
COPY --from=dependencies /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=dependencies /app/node_modules/postgres ./node_modules/postgres
COPY --from=dependencies /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
