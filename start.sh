#!/bin/sh
set -e

echo "==> Running database migrations..."
flask db upgrade

echo "==> Starting gunicorn on port ${PORT:-8080}..."
exec gunicorn app.wsgi:app \
  --bind "0.0.0.0:${PORT:-8080}" \
  --workers 2 \
  --timeout 120 \
  --access-logfile -
