#!/bin/sh
set -e

echo "==> All environment variables (values hidden):"
env | sed 's/=.*/=***/' | sort

echo "==> Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in environment."
  exit 1
fi

echo "==> DATABASE_URL is set, running migrations..."
flask db upgrade

echo "==> Starting gunicorn on port ${PORT:-8080}..."
exec gunicorn app.wsgi:app \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 2 \
  --timeout 120 \
  --access-logfile -
