FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY avtorazbor-backend/pyproject.toml ./
RUN pip install --no-cache-dir -e ".[prod]"

COPY avtorazbor-backend/app/ ./app/
COPY avtorazbor-backend/migrations/ ./migrations/
COPY avtorazbor-backend/alembic.ini ./

EXPOSE 8080

CMD flask db upgrade && gunicorn app.wsgi:app \
    --bind 0.0.0.0:${PORT:-8080} \
    --workers 2 \
    --timeout 120 \
    --access-logfile -
