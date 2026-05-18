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
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV FLASK_APP=app.wsgi
EXPOSE 8080

CMD ["./start.sh"]
