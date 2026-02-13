#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY_COUNT=0

until node -e "
  const postgres = require('postgres');
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 5 });
  sql\`SELECT 1\`.then(() => { sql.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "PostgreSQL not ready after $MAX_RETRIES attempts, aborting"
    exit 1
  fi
  echo "PostgreSQL not ready (attempt $RETRY_COUNT/$MAX_RETRIES), retrying in 2s..."
  sleep 2
done

echo "PostgreSQL is ready"

echo "Running database migrations..."
node scripts/migrate.mjs

if [ "$SEED_ON_INIT" = "true" ]; then
  echo "Running database seed..."
  node scripts/seed.mjs
fi

exec "$@"
