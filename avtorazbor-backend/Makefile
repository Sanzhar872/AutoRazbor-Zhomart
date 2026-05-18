.PHONY: install dev test lint format migrate seed-admin

install:
	pip install -e ".[dev]"

dev:
	flask --app app.wsgi run --debug --port 5000

test:
	pytest -v

lint:
	ruff check app tests
	mypy app

format:
	black app tests
	ruff check --fix app tests

migrate:
	flask --app app.wsgi db upgrade

migrate-create:
	flask --app app.wsgi db migrate -m "$(msg)"

seed-admin:
	python scripts/seed_admin.py

docker-up:
	docker compose up -d db

docker-down:
	docker compose down
