#!/bin/sh
set -e

# Railway may expose the DB URL under different names — try all of them
if [ -z "$DATABASE_URL" ] && [ -n "$PGURL" ];          then DATABASE_URL="$PGURL";          fi
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_URL" ];   then DATABASE_URL="$POSTGRES_URL";   fi
if [ -z "$DATABASE_URL" ] && [ -n "$RAILWAY_TCP_PROXY_DOMAIN" ]; then
  # last-resort: build URL from individual PG_* vars
  DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE}"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Hint: in Railway backend service > Variables, add:"
  echo "  DATABASE_URL = \${{Postgres.DATABASE_URL}}"
  echo ""
  echo "Available DB-related env vars (values hidden):"
  env | grep -iE '^(PG|DB|POSTGRES|DATABASE|RAILWAY)' | sed 's/=.*/=[hidden]/' || true
  exit 1
fi

export DATABASE_URL

echo "==> Running database migrations..."
flask db upgrade

echo "==> Starting gunicorn on port ${PORT:-8080}..."
exec gunicorn app.wsgi:app \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 2 \
  --timeout 120 \
  --access-logfile -
