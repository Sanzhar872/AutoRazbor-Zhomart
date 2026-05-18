#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

export DATABASE_URL

echo "==> Running database migrations..."
flask db upgrade

echo "==> Seeding admin user..."
python scripts/seed_admin.py

echo "==> Starting gunicorn on port ${PORT:-8080}..."
exec gunicorn app.wsgi:app \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 2 \
  --timeout 120 \
  --access-logfile -
