# AvtoRazbor — Полная спецификация проекта v1

> Сайт **avtorazbor.kz** — магазин Б/У автозапчастей.
> Бэкенд: Python/Flask + PostgreSQL + Google Cloud. Фронтенд: Vite + React + TypeScript.
> Документ — единственный источник правды. Любые отклонения — через PR в этот файл.

---

## Содержание

- [0. TL;DR](#0-tldr)
- [1. Полный стек](#1-полный-стек)
- [2. Структура репозиториев](#2-структура-репозиториев)
- [3. Доменная модель](#3-доменная-модель)
- [4. Схема БД](#4-схема-бд)
- [5. Бизнес-логика: избранное и лимиты слотов](#5-бизнес-логика-избранное-и-лимиты-слотов)
- [6. API Endpoints](#6-api-endpoints)
- [7. Дизайн-система](#7-дизайн-система)
- [8. Страницы и компоненты](#8-страницы-и-компоненты)
- [9. Фронтенд: API-слой и стейт](#9-фронтенд-api-слой-и-стейт)
- [10. Auth-flow](#10-auth-flow)
- [11. Деплой](#11-деплой)
- [12. Переменные окружения](#12-переменные-окружения)
- [13. SEO](#13-seo)
- [14. Тесты](#14-тесты)
- [15. Соглашения и качество](#15-соглашения-и-качество)
- [16. Security checklist](#16-security-checklist)
- [17. Roadmap / Milestones](#17-roadmap--milestones)
- [18. Контакты и ответственные](#18-контакты-и-ответственные)
- [19. Open questions](#19-open-questions)

---

## 0. TL;DR

**Что строим:** витрину магазина авторазбора. Тёмный, современный, быстрый сайт — выглядит как реальный коммерческий проект, не шаблон.

**Три типа пользователей:**

| Роль | Что может |
|---|---|
| Анонимный | Просматривает каталог, ищет запчасти, видит телефон |
| Покупатель (auth) | Всё выше + добавляет в избранное с учётом динамических лимитов |
| Администратор | Отдельный раздел `/admin` — CRUD запчастей, управление остатками склада |

**Покупка:** клиент **звонит по номеру телефона**. Кнопка «Позвонить» есть на каждой странице. Корзины и онлайн-оплаты в v1 нет.

**Инфраструктура:** Cloud Run (бэк) + Cloud SQL / PostgreSQL + GCS (фото) + Firebase Hosting (фронт) + Secret Manager + Cloud Build CI.

---

## 1. Полный стек

### Бэкенд

| Слой | Технология | Версия | Зачем |
|---|---|---|---|
| Язык | Python | 3.12 | Стабильно, есть на Cloud Run |
| Web-framework | Flask | 3.x | Лёгкий монолит |
| ORM | SQLAlchemy | 2.x | Современный API, типизация |
| Миграции | Alembic | latest | Версионирование схемы |
| Валидация | Marshmallow + apispec | latest | Сериализация + auto OpenAPI |
| Auth | Flask-JWT-Extended | latest | JWT access + refresh |
| Пароли | argon2-cffi | latest | OWASP-рекомендованный |
| Конфиг | python-dotenv + pydantic-settings | latest | Типизированные env |
| Логи | structlog (JSON) | latest | Cloud Logging-friendly |
| WSGI | gunicorn | latest | Прод-сервер |
| Кеш / Rate-limit | Flask-Limiter (in-memory v1, Redis v2) | latest | Защита auth + поиска |
| Тесты | pytest + pytest-flask + factory-boy | latest | Unit + integration |
| Lint/format | ruff + black + mypy (strict) | latest | Качество кода |
| Контейнер | Docker | 24+ | Cloud Run требует |
| База | PostgreSQL | 16 (Cloud SQL) | Транзакции, JSONB, FTS |
| Медиа | Google Cloud Storage | — | Фото запчастей (до 10 на позицию) |
| Деплой | Google Cloud Run | — | Stateless, авто-scale |
| Секреты | Google Secret Manager | — | Не хранить в env |
| CI/CD | Cloud Build (`cloudbuild.yaml`) | — | Авто-деплой из main |

### Фронтенд

| Слой | Технология | Версия | Зачем |
|---|---|---|---|
| Сборщик | Vite | 5.x | Быстрый HMR, нативный ESM |
| UI | React | 18.x | Компонентная модель |
| Язык | TypeScript | 5.x | Типизация API-ответов, меньше багов |
| Стили | Tailwind CSS | 4.x | Утилиты, тёмная тема встроена |
| Состояние | Zustand | 4.x | Auth store, favorites store — легковесно |
| Запросы | TanStack Query | 5.x | Кеш, фоновый re-fetch, optimistic update |
| Роутинг | React Router | 6.x | SPA навигация, lazy-load страниц |
| Формы | React Hook Form + Zod | latest | Валидация без лишних ре-рендеров |
| Иконки | Lucide React | latest | Консистентный набор SVG-иконок |
| Галерея | Swiper.js | latest | Touch-friendly галерея фото запчасти |
| Уведомления | Sonner | latest | Toast (успех, ошибка, предупреждение) |
| Дата/время | date-fns | latest | Форматирование без bloat |
| Lint/format | ESLint + Prettier | latest | Качество кода |
| Тесты | Vitest + Testing Library | latest | Unit + component |
| E2E | Playwright | latest | Критические пути |
| Деплой | Firebase Hosting | — | CDN, авто HTTPS, preview channels |

### Принципы (общие)

- **12-factor app.** Бэкенд stateless — никаких локальных файлов в рантайме.
- **Все ID — UUID v4.** Нет утечки счётчика, нет конфликтов при импортах.
- **Все timestamps — `timestamptz` в UTC.**
- **Soft delete** для контентных сущностей (`deleted_at`), hard delete только для пользователей.
- **`stock` никогда не < 0** — проверяется на уровне сервиса и БД (`CHECK (stock >= 0)`).
- **Mobile-first.** Все компоненты сначала под 375px, потом расширяются.
- **Никаких `any` в TypeScript.** Строгий режим (`"strict": true`).
- **API-слой изолирован** в `src/api/`. Компоненты не делают `fetch` напрямую.

---

## 2. Структура репозиториев

### 2.1 Бэкенд (`avtorazbor-backend/`)

```
avtorazbor-backend/
├── app/
│   ├── __init__.py                  # application factory: create_app()
│   ├── config.py                    # Pydantic Settings, env loading
│   ├── extensions.py                # db, migrate, jwt, ma, limiter
│   ├── models/
│   │   ├── base.py                  # TimestampMixin, SoftDeleteMixin, UUID PK
│   │   ├── user.py                  # User, Role (admin | customer)
│   │   ├── part.py                  # Part, PartImage, PartCondition
│   │   ├── car.py                   # CarMake, CarModel, CarGeneration
│   │   ├── category.py              # Category (дерево: Двигатель > Поршень)
│   │   ├── favorite.py              # Favorite (user ↔ part, с лимитом)
│   │   ├── media.py                 # MediaAsset (метаданные о файлах в GCS)
│   │   └── audit.py                 # AuditLog
│   ├── schemas/
│   │   ├── user.py
│   │   ├── part.py
│   │   ├── car.py
│   │   ├── category.py
│   │   ├── favorite.py
│   │   └── media.py
│   ├── api/
│   │   ├── __init__.py              # register_blueprints()
│   │   ├── auth.py                  # /api/v1/auth/*
│   │   ├── users.py                 # /api/v1/users/*        (admin)
│   │   ├── parts.py                 # /api/v1/parts/*        (public read, admin write)
│   │   ├── cars.py                  # /api/v1/cars/*         (справочник)
│   │   ├── categories.py            # /api/v1/categories/*
│   │   ├── favorites.py             # /api/v1/favorites/*    (auth user)
│   │   ├── admin/
│   │   │   ├── stock.py             # /api/v1/admin/stock/*
│   │   │   └── dashboard.py         # /api/v1/admin/dashboard
│   │   ├── media.py                 # /api/v1/media/upload
│   │   └── health.py                # /healthz, /readyz
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── part_service.py
│   │   ├── stock_service.py         # Atomic изменение остатков
│   │   ├── favorite_service.py      # Лимиты слотов, динамическая логика
│   │   ├── search_service.py        # Полнотекстовый поиск (tsvector)
│   │   ├── media_service.py         # GCS upload, signed URL
│   │   ├── slug_service.py
│   │   └── audit_service.py
│   ├── permissions.py               # @require_role('admin'), @require_auth
│   ├── errors.py                    # Custom exceptions + RFC 7807 handler
│   └── utils/
│       ├── pagination.py
│       ├── pwhash.py
│       └── favorite_slots.py        # get_favorite_slots(stock) → int
├── migrations/
├── tests/
│   ├── conftest.py
│   ├── unit/
│   │   ├── test_favorite_slots.py
│   │   └── test_stock_service.py
│   └── integration/
│       ├── test_parts_api.py
│       ├── test_favorites_api.py
│       └── test_admin_stock_api.py
├── scripts/
│   ├── seed_admin.py
│   ├── seed_catalog.py
│   └── backup_db.sh
├── Dockerfile
├── cloudbuild.yaml
├── pyproject.toml
├── alembic.ini
├── .env.example
├── Makefile
└── README.md
```

**Правила слоёв:**
- `api/` — **тонкие** роуты: парсят запрос, вызывают сервис, сериализуют ответ. Никакой бизнес-логики.
- `services/` — вся бизнес-логика. Возвращают доменные объекты, не Response.
- `models/` — только SQLAlchemy. Никаких HTTP-зависимостей.
- `schemas/` — валидация input и формирование output. Разные варианты схем: `UserCreateSchema`, `UserPublicSchema`, `UserAdminSchema`.

### 2.2 Фронтенд (`avtorazbor-frontend/`)

```
avtorazbor-frontend/
├── public/
│   ├── favicon.svg
│   ├── og-image.jpg                  # OpenGraph превью
│   └── robots.txt
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # Router + QueryClient + Zustand провайдеры
│   │
│   ├── api/                          # Единственное место с axios
│   │   ├── client.ts                 # axios instance, interceptors, token refresh
│   │   ├── auth.api.ts
│   │   ├── parts.api.ts
│   │   ├── cars.api.ts
│   │   ├── categories.api.ts
│   │   ├── favorites.api.ts
│   │   ├── media.api.ts
│   │   ├── admin.api.ts
│   │   └── config.api.ts             # GET /api/v1/config (телефон, часы)
│   │
│   ├── types/                        # TS-типы, зеркалящие API-схемы
│   │   ├── part.ts
│   │   ├── car.ts
│   │   ├── category.ts
│   │   ├── user.ts
│   │   ├── favorite.ts
│   │   └── api.ts                    # PaginatedResponse<T>, ApiError, FavoriteMeta
│   │
│   ├── hooks/                        # Custom hooks поверх TanStack Query
│   │   ├── useParts.ts
│   │   ├── useFavorites.ts           # useToggleFavorite (optimistic update)
│   │   ├── useCars.ts
│   │   ├── useCategories.ts
│   │   ├── useAuth.ts
│   │   ├── useAdmin.ts
│   │   └── useConfig.ts              # телефон, часы из /api/v1/config
│   │
│   ├── store/
│   │   ├── auth.store.ts             # user, tokens, setUser, clearAuth
│   │   └── ui.store.ts               # mobileFiltersOpen, searchQuery
│   │
│   ├── pages/
│   │   ├── HomePage/
│   │   │   ├── index.tsx
│   │   │   ├── HeroBanner.tsx
│   │   │   ├── FeaturedParts.tsx
│   │   │   ├── PopularCategories.tsx
│   │   │   └── CallToAction.tsx
│   │   ├── CatalogPage/
│   │   │   ├── index.tsx
│   │   │   ├── CatalogFilters.tsx    # sidebar / bottom sheet
│   │   │   ├── CatalogGrid.tsx
│   │   │   ├── SortBar.tsx
│   │   │   └── ActiveFilters.tsx     # чипы активных фильтров
│   │   ├── PartPage/
│   │   │   ├── index.tsx
│   │   │   ├── PartGallery.tsx       # Swiper, до 10 фото
│   │   │   ├── PartInfo.tsx
│   │   │   ├── FavoriteBlock.tsx     # кнопка + слот-индикатор
│   │   │   ├── CallBlock.tsx
│   │   │   └── RelatedParts.tsx
│   │   ├── SearchPage/index.tsx
│   │   ├── FavoritesPage/index.tsx
│   │   ├── AuthPage/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── ProfilePage/index.tsx
│   │   ├── NotFoundPage/index.tsx
│   │   └── admin/
│   │       ├── AdminLayout.tsx
│   │       ├── DashboardPage/index.tsx
│   │       ├── PartsListPage/
│   │       │   ├── index.tsx
│   │       │   └── PartRow.tsx
│   │       ├── PartFormPage/
│   │       │   ├── index.tsx
│   │       │   ├── ImageUploadZone.tsx
│   │       │   └── CarCompatibility.tsx
│   │       ├── StockPage/
│   │       │   ├── index.tsx
│   │       │   ├── StockTable.tsx
│   │       │   └── StockChangeModal.tsx
│   │       └── CatalogAdminPage/index.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx             # Хорошее / Удовл. / Нет в наличии
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── BottomSheet.tsx       # mobile draggable sheet
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── Pagination.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx         # mobile: 5 иконок внизу
│   │   │   ├── Footer.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── parts/
│   │   │   ├── PartCard.tsx
│   │   │   ├── PartCardSkeleton.tsx
│   │   │   └── PartConditionBadge.tsx
│   │   ├── favorites/
│   │   │   ├── FavoriteButton.tsx    # сердечко с анимацией
│   │   │   └── FavoriteSlotBar.tsx   # ● ● ○ индикатор
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchDropdown.tsx    # debounce 300ms
│   │   ├── filters/
│   │   │   ├── CarFilter.tsx         # каскад: марка → модель → поколение
│   │   │   ├── CategoryFilter.tsx
│   │   │   ├── PriceRangeFilter.tsx
│   │   │   └── ConditionFilter.tsx
│   │   └── phone/
│   │       ├── PhoneButton.tsx       # <a href="tel:...">
│   │       └── StickyCallBar.tsx     # липкая полоска на мобиле
│   │
│   ├── lib/
│   │   ├── queryClient.ts
│   │   ├── router.tsx                # createBrowserRouter + guards
│   │   ├── formatPrice.ts            # 25000 → «25 000 ₸»
│   │   ├── favoriteSlots.ts          # get_favorite_slots() — зеркало бэк-логики
│   │   └── cn.ts                     # clsx + tailwind-merge
│   │
│   ├── constants/
│   │   ├── routes.ts
│   │   ├── queryKeys.ts
│   │   └── strings.ru.ts             # все UI-тексты на русском
│   │
│   └── styles/
│       ├── globals.css
│       └── theme.css                 # CSS-переменные тёмной темы
│
├── e2e/
│   ├── catalog.spec.ts
│   ├── favorites.spec.ts
│   └── admin-stock.spec.ts
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
├── firebase.json
└── package.json
```

**Правила слоёв:**
- `pages/` — умные компоненты. Знают о хуках, стейте, роутинге.
- `components/` — переиспользуемые. Принимают только props. Не импортируют хуки с побочным эффектом.
- `api/` — единственное место с `axios`. Нигде в компонентах нет `fetch`.
- `types/` — только интерфейсы. Никакой логики, никаких импортов React.

---

## 3. Доменная модель

### Сущности и связи

```
User ─┬─ role ──────────> admin | customer
      ├─ has many ──────> Favorite
      └─ creates ────────> AuditLog

Part ──┬─ belongs to ───> Category (дерево, self-ref)
       ├─ fits ──────────> CarGeneration (M:N через PartCarModels)
       ├─ has many ──────> PartImage (ref → MediaAsset)
       ├─ has stock ─────> stock: int  (складской остаток)
       └─ has many ──────> Favorite

CarMake ──> CarModel ──> CarGeneration

Category ── self-ref (parent_id) ──> дерево
            Пример: Двигатель > Топливная система > Инжектор

Favorite ── user_id ──> User
         └─ part_id ──> Part
            UNIQUE (user_id, part_id)
            Limit: favorite_slots(part.stock)

MediaAsset  метаданные файла в GCS (url, mime, size, uploaded_by)
AuditLog    actor_id, action, entity_type, entity_id, diff (JSONB)
```

### Почему именно так

1. **`parts`** — центральная сущность. Одна строка = одна позиция.
2. **`part_images`** — до 10 фото с порядком (`position`). Покупатели смотрят на фото.
3. **`car_makes / car_models / car_generations`** — нормализованный справочник. Фильтр «все запчасти на Toyota Camry V50 2012–2017» без ручных строк.
4. **`part_car_models`** — M:N. Одна запчасть подходит к нескольким моделям (универсальные).
5. **`categories`** — дерево (`parent_id`). Глубина до 3 уровней в v1.
6. **`stock`** — integer, меняется только через `stock_service` (atomic, `>= 0`).
7. **`favorites`** — динамический лимит слотов (см. раздел 5).
8. **`contact_phone`** — конфиг в env, отдаётся через `/api/v1/config` публично.

---

## 4. Схема БД

> Финальный DDL — через Alembic-миграции. Все таблицы: `id UUID PK`, `created_at`, `updated_at`. Контентные — плюс `deleted_at`.

### Пользователи

```sql
CREATE TYPE user_role AS ENUM ('admin', 'customer');

CREATE TABLE users (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           citext      UNIQUE NOT NULL,
  password_hash   text        NOT NULL,
  full_name       text        NOT NULL,
  phone           text,
  role            user_role   NOT NULL DEFAULT 'customer',
  is_active       boolean     NOT NULL DEFAULT true,
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text        NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rt_user_idx ON refresh_tokens(user_id);
```

### Справочник автомобилей

```sql
CREATE TABLE car_makes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,  -- Toyota, BMW, ВАЗ
  slug       text NOT NULL UNIQUE,
  logo_url   text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE car_models (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make_id    uuid NOT NULL REFERENCES car_makes(id) ON DELETE CASCADE,
  name       text NOT NULL,         -- Camry, 3 Series
  slug       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(make_id, name)
);

CREATE TABLE car_generations (
  id         uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id   uuid     NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
  name       text     NOT NULL,     -- V50, E90
  year_from  smallint,
  year_to    smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Категории

```sql
CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  icon_url   text,
  sort_order int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX cat_parent_idx ON categories(parent_id);
```

### Запчасти

```sql
CREATE TYPE part_condition AS ENUM ('good', 'fair', 'poor');
CREATE TYPE part_status    AS ENUM ('active', 'sold_out', 'draft', 'archived');

CREATE TABLE parts (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   uuid           NOT NULL REFERENCES categories(id),
  title         text           NOT NULL,
  slug          text           NOT NULL UNIQUE,
  description   text,
  oem_number    text,                         -- OEM / каталожный номер
  sku           text           UNIQUE,        -- внутренний артикул
  price_kzt     numeric(12,2)  NOT NULL,
  stock         int            NOT NULL DEFAULT 0 CHECK (stock >= 0),
  condition     part_condition NOT NULL DEFAULT 'good',
  status        part_status    NOT NULL DEFAULT 'draft',
  weight_kg     numeric(6,2),
  search_vector tsvector,                     -- обновляется триггером
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX parts_category_idx ON parts(category_id);
CREATE INDEX parts_status_idx   ON parts(status);
CREATE INDEX parts_stock_idx    ON parts(stock);
CREATE INDEX parts_search_idx   ON parts USING GIN(search_vector);
CREATE INDEX parts_oem_idx      ON parts(oem_number);

-- M:N запчасть ↔ поколение авто
CREATE TABLE part_car_models (
  part_id       uuid NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  generation_id uuid NOT NULL REFERENCES car_generations(id) ON DELETE CASCADE,
  PRIMARY KEY (part_id, generation_id)
);

-- Фото
CREATE TABLE part_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id    uuid NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  asset_id   uuid NOT NULL REFERENCES media_assets(id),
  position   int  NOT NULL DEFAULT 0,
  is_primary bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pi_part_idx ON part_images(part_id, position);
```

### Избранное

```sql
CREATE TABLE favorites (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  part_id    uuid        NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, part_id)
);
CREATE INDEX fav_user_idx ON favorites(user_id);
CREATE INDEX fav_part_idx ON favorites(part_id);
```

### Медиа и аудит

```sql
CREATE TABLE media_assets (
  id          uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  gcs_path    text   NOT NULL UNIQUE,
  public_url  text   NOT NULL,
  mime_type   text   NOT NULL,
  size_bytes  bigint NOT NULL,
  uploaded_by uuid   REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,   -- 'part.stock.increase', 'favorite.add'
  entity_type text NOT NULL,
  entity_id   uuid,
  diff        jsonb,           -- {before: {...}, after: {...}}
  ip_address  inet,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_actor_idx  ON audit_log(actor_id);
CREATE INDEX audit_entity_idx ON audit_log(entity_type, entity_id);
```

### Полнотекстовый поиск — триггер

```sql
CREATE OR REPLACE FUNCTION parts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('russian', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('russian', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple',  coalesce(NEW.oem_number, '')), 'A') ||
    setweight(to_tsvector('simple',  coalesce(NEW.sku, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parts_search_update
  BEFORE INSERT OR UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION parts_search_vector_update();
```

---

## 5. Бизнес-логика: избранное и лимиты слотов

> Ключевая фича v1. Лимит слотов — сколько **разных пользователей** могут одновременно держать запчасть в избранном. Защищает дефицитные позиции от «заморозки» вниманием.

### Таблица лимитов

| Остаток (`stock`) | Макс. слотов (`max_favorites`) |
|---|---|
| 0 | 0 — добавить нельзя, нет на складе |
| 1–4 | 3 |
| 5–9 | 4 |
| 10–19 | 5 |
| 20+ | 7 |

### Серверная логика (`favorite_service.py`)

```python
def get_favorite_slots(stock: int) -> int:
    if stock == 0:   return 0
    elif stock < 5:  return 3
    elif stock < 10: return 4
    elif stock < 20: return 5
    else:            return 7

def add_to_favorites(user_id: UUID, part_id: UUID) -> Favorite:
    part = Part.query.get_or_404(part_id)

    if part.status != 'active':
        raise PartNotAvailableError("Запчасть недоступна")

    max_slots = get_favorite_slots(part.stock)
    if max_slots == 0:
        raise FavoriteSlotError("Товар закончился на складе")

    current_count = Favorite.query.filter_by(part_id=part_id).count()
    if current_count >= max_slots:
        raise FavoriteSlotError(
            f"Все {max_slots} слотов избранного заняты. Попробуйте позже."
        )

    existing = Favorite.query.filter_by(user_id=user_id, part_id=part_id).first()
    if existing:
        raise AlreadyFavoritedError("Уже в избранном")

    fav = Favorite(user_id=user_id, part_id=part_id)
    db.session.add(fav)
    db.session.commit()
    audit_service.log('favorite.add', actor_id=user_id, entity=fav)
    return fav
```

### Клиентская логика (`src/lib/favoriteSlots.ts`)

```typescript
// Зеркало серверной логики — для UI (disabled состояния, тексты)
export function getFavoriteSlots(stock: number): number {
  if (stock === 0)  return 0;
  if (stock < 5)   return 3;
  if (stock < 10)  return 4;
  if (stock < 20)  return 5;
  return 7;
}
```

### API-ответ с мета-информацией

При `GET /api/v1/parts/:id` возвращается поле `favorite_meta`:

```json
{
  "id": "...",
  "title": "Фара левая Toyota Camry V50",
  "stock": 3,
  "price_kzt": 25000,
  "status": "active",
  "favorite_meta": {
    "max_slots": 3,
    "used_slots": 2,
    "available_slots": 1,
    "is_favorited_by_me": false
  }
}
```

> `is_favorited_by_me` — `true` только если запрос авторизован и текущий пользователь уже добавил в избранное.

### Правило при изменении stock

При каждом изменении `stock` через `stock_service`:
- Если новый `max_slots < current_favorites_count` — **никого не выкидываем**. Уже добавленные остаются, новые не принимаются.
- Если `stock = 0` — `status` автоматически меняется на `sold_out`. Добавить в избранное невозможно.

---

## 6. API Endpoints

### 6.1 Auth (`/api/v1/auth`)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/register` | Public | Регистрация покупателя |
| POST | `/login` | Public | Логин → access + refresh JWT |
| POST | `/refresh` | Refresh token | Обновить access token |
| POST | `/logout` | Auth | Инвалидировать refresh token |
| GET | `/me` | Auth | Профиль текущего пользователя |
| PATCH | `/me` | Auth | Обновить профиль |
| POST | `/change-password` | Auth | Смена пароля |

### 6.2 Запчасти (`/api/v1/parts`)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/` | Public | Список (фильтры, пагинация, поиск) |
| GET | `/:id` | Public | Детальная карточка + `favorite_meta` |
| POST | `/` | Admin | Создать позицию |
| PATCH | `/:id` | Admin | Обновить позицию |
| DELETE | `/:id` | Admin | Soft delete |

**Query params для `GET /`:**
`category_id`, `make_id`, `model_id`, `generation_id`, `status`, `condition`, `price_min`, `price_max`, `oem`, `q` (FTS), `sort` (price_asc / price_desc / newest / stock_desc), `page`, `per_page` (default 20, max 100).

### 6.3 Справочники

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/api/v1/cars/makes` | Public | Все марки |
| GET | `/api/v1/cars/makes/:id/models` | Public | Модели марки |
| GET | `/api/v1/cars/models/:id/generations` | Public | Поколения модели |
| POST/PATCH/DELETE | `/api/v1/cars/*` | Admin | CRUD справочника |
| GET | `/api/v1/categories` | Public | Дерево категорий |
| POST/PATCH/DELETE | `/api/v1/categories/*` | Admin | CRUD категорий |

### 6.4 Избранное (`/api/v1/favorites`)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/` | Auth | Мои избранные |
| POST | `/` | Auth | Добавить `{part_id}` |
| DELETE | `/:part_id` | Auth | Убрать из избранного |

**Ошибки POST:**
- `409` — уже в избранном
- `422` — все слоты заняты
- `400` — stock = 0
- `404` — запчасть не найдена

### 6.5 Администрирование склада (`/api/v1/admin`)

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | Статистика |
| GET | `/admin/stock` | Admin | Все позиции с остатками |
| POST | `/admin/stock/:id/increase` | Admin | `{delta, comment}` |
| POST | `/admin/stock/:id/decrease` | Admin | `{delta, comment}` |
| POST | `/admin/stock/:id/set` | Admin | `{stock, comment}` |
| GET | `/admin/parts/:id/favorites` | Admin | Кто добавил в избранное |

**Ответ на изменение stock:**
```json
{
  "part_id": "...",
  "title": "Фара левая Toyota Camry V50",
  "stock_before": 3,
  "stock_after": 8,
  "max_favorites_before": 3,
  "max_favorites_after": 4,
  "comment": "Поступление от поставщика",
  "changed_by": "admin@avtorazbor.kz",
  "changed_at": "2026-05-17T10:00:00Z"
}
```

### 6.6 Конфиг и медиа

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| GET | `/api/v1/config` | Public | Телефон, часы, адрес |
| POST | `/api/v1/media/upload` | Admin | Загрузить фото → GCS URL |
| GET | `/healthz` | Public | Liveness |
| GET | `/readyz` | Public | Readiness + проверка БД |

**`GET /api/v1/config`:**
```json
{
  "contact_phone": "+7XXXXXXXXXX",
  "contact_phone_display": "8 (XXX) XXX-XX-XX",
  "working_hours": "Пн–Сб 9:00–18:00",
  "address": "г. Алматы, ...",
  "whatsapp_link": "https://wa.me/7XXXXXXXXXX"
}
```

### 6.7 Формат ошибок (RFC 7807)

```json
{
  "type": "https://avtorazbor.kz/errors/favorite-slot-full",
  "title": "Все слоты избранного заняты",
  "status": 422,
  "detail": "Все 3 слота для этой позиции заняты. Попробуйте позже.",
  "part_id": "..."
}
```

---

## 7. Дизайн-система

### Цвета (CSS-переменные, dark theme)

```css
:root {
  /* Фоны */
  --bg-base:      #0F0F0F;   /* главный фон */
  --bg-surface:   #1A1A1A;   /* карточки, сайдбар */
  --bg-elevated:  #222222;   /* модалки, дропдауны */
  --bg-input:     #2A2A2A;   /* поля ввода */

  /* Акцент */
  --accent:       #E53E3E;
  --accent-hover: #C53030;
  --accent-muted: rgba(229, 62, 62, 0.15);

  /* Текст */
  --text-primary:   #F7F7F7;
  --text-secondary: #A0A0A0;
  --text-muted:     #666666;

  /* Границы */
  --border:       #2D2D2D;
  --border-focus: #E53E3E;

  /* Статусы */
  --success: #38A169;
  --warning: #D69E2E;
  --danger:  #E53E3E;

  /* Прочее */
  --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.5);
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
}
```

### Типографика

| Роль | Шрифт | Размер | Начертание |
|---|---|---|---|
| Основной текст | Inter | 14–16px | 400 |
| Заголовки | Inter | 20–36px | 600–700 |
| Цена | Inter | 22–28px | 700 |
| Артикул / OEM | JetBrains Mono | 13px | 400 |
| Кнопки | Inter | 14–15px | 500 |
| Подписи | Inter | 12px | 400, muted |

### Брейкпоинты

| Точка | Ширина | Особенности |
|---|---|---|
| mobile | 375px | 1 колонка каталога, bottom nav |
| sm | 640px | 2 колонки каталога |
| md | 768px | sidebar фильтров |
| lg | 1024px | 3 колонки |
| xl | 1280px | 4 колонки, full header |

### Анимации

- Hover карточки: `translateY(-2px)` + `box-shadow` — 150ms ease.
- Кнопка «В избранное»: пульс сердца scale 1 → 1.3 → 1 — 300ms.
- Skeleton: shimmer `background-position` — 1.5s infinite.
- Bottom sheet: slide-up — 280ms cubic-bezier(0.32, 0.72, 0, 1).
- Toast (Sonner): slide-in — 200ms.

---

## 8. Страницы и компоненты

### 8.1 Таблица страниц

| URL | Доступ | Описание |
|---|---|---|
| `/` | Public | Главная |
| `/catalog` | Public | Каталог с фильтрами |
| `/catalog/:slug` | Public | Карточка запчасти |
| `/search?q=...` | Public | Результаты поиска |
| `/favorites` | Auth | Мои избранные |
| `/login` | Public | Вход |
| `/register` | Public | Регистрация |
| `/profile` | Auth | Профиль |
| `/admin` | Admin | Дашборд |
| `/admin/parts` | Admin | Список запчастей |
| `/admin/parts/new` | Admin | Добавить запчасть |
| `/admin/parts/:id/edit` | Admin | Редактировать |
| `/admin/stock` | Admin | Управление остатками |
| `/admin/cars` | Admin | Справочник авто |
| `/admin/categories` | Admin | Дерево категорий |

### 8.2 Главная страница

```
Header
───────────────────────────────────────────────────────
HeroBanner
  Тёмное фото разборки + оверлей
  «Б/У запчасти в наличии — звоните»
  [Смотреть каталог]   [Позвонить: +7 XXX XXX-XX-XX]
───────────────────────────────────────────────────────
PopularCategories
  Сетка 4–6 иконок: Двигатель / Кузов / АКПП / Ходовая
───────────────────────────────────────────────────────
FeaturedParts «Новые поступления»
  Mobile: горизонтальный скролл карточек
  Desktop: сетка 4 колонки
───────────────────────────────────────────────────────
CallToAction
  Тёмный блок с акцентом: номер крупно + WhatsApp
───────────────────────────────────────────────────────
Footer
```

### 8.3 Каталог

```
Desktop:
  [Sidebar 280px — фильтры] | [SortBar + CatalogGrid]

Mobile:
  [SortBar + кнопка «Фильтры»]
  [CatalogGrid 2 колонки]
  [BottomSheet — draggable, при нажатии «Фильтры»]

ActiveFilters: чипы над сеткой
  [Toyota ×]  [Двигатель ×]  [до 50 000 ₸ ×]
```

**Фильтры:**
- `CarFilter` — каскад: марка → модель → поколение (загружает следующий уровень при выборе).
- `CategoryFilter` — раскрываемое дерево. Активная категория — красный акцент.
- `PriceRangeFilter` — два input: «от» / «до», формат 1 000 ₸.
- `ConditionFilter` — три чекбокса.
- Кнопки «Применить» и «Сбросить».

### 8.4 Карточка запчасти

```
[← Назад]   [Каталог > Двигатель > Инжекторы]
─────────────────────────────────────────────────────────
[PartGallery]              [PartInfo]
 Swiper, до 10 фото         Название
 Thumbnails внизу           ─────────────────────────────
                            Состояние:  [● Хорошее]
                            Цена:  25 000 ₸
                            OEM:  81150-06430
                            Подходит: Toyota Camry V50 12–17
                            ─────────────────────────────
                            [FavoriteBlock]
                              ● ● ○  «1 место осталось»
                              [♡ В избранное]
                            ─────────────────────────────
                            [CallBlock]
                              📞  Позвонить
                              +7 (XXX) XXX-XX-XX
                              Пн–Сб 9:00–18:00
─────────────────────────────────────────────────────────
Описание
RelatedParts (горизонтальный скролл)
```

**Mobile:** галерея сверху, информация снизу. `StickyCallBar` — фиксированная полоска поверх контента.

### 8.5 FavoriteBlock — все состояния

```
stock = 0                   → disabled, «Нет в наличии»
available_slots = 0         → disabled, «Нет мест в избранном»
is_favorited_by_me = false  → ♡ «В избранное»  (outline, активная)
is_favorited_by_me = true   → ♥ «В избранном»  (accent, нажатие — удалить)

Слот-индикатор:
  available_slots = 0  →  ● ● ●  «Все места заняты»
  available_slots = 1  →  ● ● ○  «1 место осталось»
  available_slots ≥ 2  →  ● ○ ○  (текст не нужен)
```

### 8.6 Админ-панель

**Дашборд:**
```
┌────────────────────────────────────────────────┐
│  Всего позиций: 348    Активных: 312           │
│  Дефицит (< 5 шт): 24           [Смотреть]    │
│  Добавлено сегодня: 8                          │
│  Топ-5 в избранном: [карточки]                 │
└────────────────────────────────────────────────┘
```

**Форма запчасти:**
```
Название*
Категория* (дерево-дропдаун)
Описание
OEM номер / Артикул (SKU)
Цена (KZT)*
Количество*
Состояние* (radio: Хорошее / Удовл. / Плохое)
Статус (toggle: Черновик / Активный)

Совместимость:
  + Добавить → марка → модель → поколение
  [Toyota Camry V50 ×]  [BMW 3 E90 ×]

Фотографии:
  Drag & drop, до 10 файлов
  Preview + drag-to-reorder
  Первое фото = главное
```

**StockChangeModal:**
```
Запчасть: Фара левая Toyota Camry V50
Текущий остаток: 3

Действие:  [Пополнить ▼]  /  [Списать]  /  [Установить]
Количество: [___]
Комментарий: [________________________]

После: остаток станет 8
Лимит избранного: 3 → 4 слота

[Отмена]  [Сохранить]
```

---

## 9. Фронтенд: API-слой и стейт

### Axios client

```typescript
// src/api/client.ts
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
});

// Request: добавляет Authorization Bearer
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: при 401 → рефреш → повтор; если рефреш упал → clearAuth → /login
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const ok = await refreshTokens();
      if (ok) return client(error.config);
      useAuthStore.getState().clearAuth();
      window.location.href = ROUTES.LOGIN;
    }
    return Promise.reject(error);
  }
);
```

### TypeScript-типы

```typescript
// src/types/api.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface FavoriteMeta {
  max_slots: number;
  used_slots: number;
  available_slots: number;
  is_favorited_by_me: boolean;
}

// src/types/part.ts
export interface Part {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  oem_number: string | null;
  sku: string | null;
  price_kzt: number;
  stock: number;
  condition: 'good' | 'fair' | 'poor';
  status: 'active' | 'sold_out' | 'draft' | 'archived';
  category: Category;
  car_generations: CarGeneration[];
  images: PartImage[];
  favorite_meta?: FavoriteMeta;
  created_at: string;
  updated_at: string;
}
```

### Optimistic update избранного

```typescript
// src/hooks/useFavorites.ts
const toggleFavorite = useMutation({
  mutationFn: (partId: string) => favoritesApi.toggle(partId),
  onMutate: async (partId) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.part(slug) });
    const prev = queryClient.getQueryData(queryKeys.part(slug));
    queryClient.setQueryData(queryKeys.part(slug), (old: Part) => ({
      ...old,
      favorite_meta: {
        ...old.favorite_meta,
        is_favorited_by_me: !old.favorite_meta?.is_favorited_by_me,
      },
    }));
    return { prev };
  },
  onError: (_err, _vars, ctx) => {
    queryClient.setQueryData(queryKeys.part(slug), ctx?.prev);
    toast.error(getApiError(_err)); // «Все слоты заняты» и т.д.
  },
  onSettled: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.part(slug) }),
});
```

### Query Keys

```typescript
// src/constants/queryKeys.ts
export const queryKeys = {
  parts:          (filters?: PartFilters) => ['parts', filters] as const,
  part:           (slug: string)           => ['parts', slug] as const,
  search:         (q: string)              => ['parts', 'search', q] as const,
  favorites:                                  ['favorites'] as const,
  cars:                                       ['cars'] as const,
  categories:                                 ['categories'] as const,
  config:                                     ['config'] as const,
  adminStock:                                 ['admin', 'stock'] as const,
  adminDashboard:                             ['admin', 'dashboard'] as const,
};
```

### Route Guards

```tsx
// src/lib/router.tsx
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!user)
    return <Navigate to={`${ROUTES.LOGIN}?next=${location.pathname}`} replace />;
  return <>{children}</>;
};

const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== 'admin')
    return <Navigate to={ROUTES.HOME} replace />;
  return <>{children}</>;
};
```

---

## 10. Auth-flow

```
Анонимный:
  → видит каталог / карточки / телефон
  → нажимает ♡ → редирект /login?next=<путь>

Логин:
  POST /api/v1/auth/login
  → access_token (15 мин) в Zustand (in-memory)
  → refresh_token (30 дней) в localStorage v1 / httpOnly cookie v2

После логина → редирект на next или /favorites

Рефреш:
  axios interceptor при 401
  → POST /api/v1/auth/refresh → новый access
  → если рефреш 401 → clearAuth() → /login

Выход:
  POST /api/v1/auth/logout → clearAuth() → /
```

---

## 11. Деплой

### Бэкенд (Cloud Build + Cloud Run)

```yaml
# cloudbuild.yaml
steps:
  - id: test
    name: python:3.12
    entrypoint: bash
    args: ['-c', 'pip install -e ".[dev]" && pytest -q']

  - id: build
    name: gcr.io/cloud-builders/docker
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/avtorazbor-api:$SHORT_SHA', '.']

  - id: push
    name: gcr.io/cloud-builders/docker
    args: ['push', 'gcr.io/$PROJECT_ID/avtorazbor-api:$SHORT_SHA']

  - id: migrate
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: bash
    args:
      - '-c'
      - |
        gcloud run jobs deploy avtorazbor-migrate \
          --image=gcr.io/$PROJECT_ID/avtorazbor-api:$SHORT_SHA \
          --command=flask --args=db,upgrade \
          --region=europe-west3 \
          --set-cloudsql-instances=$PROJECT_ID:europe-west3:avtorazbor-pg \
          --execute-now --wait

  - id: deploy
    name: gcr.io/google.com/cloudsdktool/cloud-sdk
    entrypoint: gcloud
    args:
      - run
      - deploy
      - avtorazbor-api
      - --image=gcr.io/$PROJECT_ID/avtorazbor-api:$SHORT_SHA
      - --region=europe-west3
      - --platform=managed
      - --allow-unauthenticated
      - --set-cloudsql-instances=$PROJECT_ID:europe-west3:avtorazbor-pg
      - --service-account=avtorazbor-backend@$PROJECT_ID.iam.gserviceaccount.com
      - --set-secrets=JWT_SECRET_KEY=jwt-secret:latest,DATABASE_URL=db-url:latest
```

### Dockerfile (бэкенд)

```dockerfile
FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e ".[prod]"

COPY app/ ./app/
COPY migrations/ ./migrations/
COPY alembic.ini ./

EXPOSE 8080
CMD ["gunicorn", "-b", ":8080", "-w", "2", "-k", "gthread", "--threads", "8", "app.wsgi:app"]
```

### Фронтенд (GitHub Actions + Firebase Hosting)

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "/assets/**",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
}
```

---

## 12. Переменные окружения

### Бэкенд (`.env`)

```bash
# База данных
DATABASE_URL=postgresql+psycopg2://user:pass@/dbname?host=/cloudsql/...

# JWT
JWT_SECRET_KEY=<256-bit>          # из Secret Manager
JWT_ACCESS_TOKEN_EXPIRES=900      # 15 мин
JWT_REFRESH_TOKEN_EXPIRES=2592000 # 30 дней

# GCS
GCS_BUCKET_NAME=avtorazbor-media
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gsa-key.json

# Контакт → отдаётся через /api/v1/config
CONTACT_PHONE=+7XXXXXXXXXX
CONTACT_PHONE_DISPLAY=8 (XXX) XXX-XX-XX
WORKING_HOURS=Пн–Сб 9:00–18:00
SHOP_ADDRESS=г. Алматы, ...
WHATSAPP_NUMBER=7XXXXXXXXXX

# Медиа
MAX_UPLOAD_BYTES=10485760         # 10 MB
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp

# Rate limits
RATE_LIMIT_AUTH=5 per minute
RATE_LIMIT_SEARCH=30 per minute
RATE_LIMIT_FAVORITES=20 per minute

# Окружение
FLASK_ENV=production
LOG_LEVEL=INFO
CORS_ORIGINS=https://avtorazbor.kz,https://www.avtorazbor.kz
```

### Фронтенд (`.env`)

```bash
VITE_API_BASE_URL=https://api.avtorazbor.kz/api/v1
VITE_APP_TITLE=АвтоРазбор — Б/У запчасти
VITE_GA_ID=G-XXXXXXXXXX          # Google Analytics (опционально)
```

> Все `VITE_*` попадают в бандл. **Никаких секретов.**

---

## 13. SEO

- `react-helmet-async`: `<title>` и `<meta description>` на каждой странице.
- OpenGraph на карточке: `og:title`, `og:image` (первое фото), `og:description`.
- `sitemap.xml` — генерируется скриптом `scripts/generate-sitemap.ts` из API.
- `robots.txt` — разрешает всё, кроме `/admin`.
- Slug-и человекочитаемые: `/catalog/fara-levaya-toyota-camry-v50-2012`.
- JSON-LD (`Product`) на карточке запчасти.

```html
<title>Фара левая Toyota Camry V50 — 25 000 ₸ | АвтоРазбор</title>
<meta name="description"
  content="Б/У фара левая Toyota Camry V50 2012-2017. Хорошее состояние. OEM 81150-06430. Звоните: +7 XXX XXX-XX-XX">
```

---

## 14. Тесты

### Бэкенд (pytest)

```
tests/unit/
├── test_favorite_slots.py   # get_favorite_slots(0)=0, (4)=3, (5)=4, (9)=4, (10)=5, (20)=7
└── test_stock_service.py    # atomic decrease, нельзя уйти в минус

tests/integration/
├── test_parts_api.py        # CRUD, фильтры, FTS
├── test_favorites_api.py    # полный путь: логин → добавить → лимит → 422
└── test_admin_stock_api.py  # increase / decrease / set, автостатус sold_out
```

Smoke-тест: `регистрация → логин → добавить запчасть → уменьшить stock до 0 → статус sold_out`.

### Фронтенд (Vitest + Testing Library)

```
tests/unit/
├── favoriteSlots.test.ts    # зеркалит серверную логику
├── formatPrice.test.ts      # 25000 → «25 000 ₸»
└── cn.test.ts

tests/components/
├── PartCard.test.tsx
├── FavoriteButton.test.tsx  # disabled при available_slots=0
├── FavoriteSlotBar.test.tsx # правильные точки и текст
├── StockChangeModal.test.tsx
└── CarFilter.test.tsx       # каскад: выбор марки → загружает модели
```

### E2E (Playwright)

```
e2e/catalog.spec.ts
  ✓ открывает каталог, видит карточки
  ✓ фильтрует по марке Toyota
  ✓ сбрасывает фильтры

e2e/favorites.spec.ts
  ✓ анонимный → кнопка ведёт на логин
  ✓ логин → добавить → видит в /favorites
  ✓ убрать → пропадает
  ✓ лимит: stock=2 → кнопка disabled после 3 добавлений

e2e/admin-stock.spec.ts
  ✓ логин admin → /admin/stock
  ✓ пополнить +5 → остаток увеличился
  ✓ списать до 0 → статус sold_out
```

**Целевые метрики Lighthouse (mobile):** LCP < 2.5s · INP < 100ms · CLS < 0.1 · Score ≥ 85.

---

## 15. Соглашения и качество

### Naming (бэкенд)

| Сущность | Стиль | Пример |
|---|---|---|
| Python модули, функции | `snake_case` | `favorite_service.py` |
| Классы | `PascalCase` | `FavoriteService` |
| Константы | `UPPER_SNAKE` | `MAX_UPLOAD_BYTES` |
| Таблицы БД | `snake_case`, мн.ч. | `part_car_models` |
| Колонки БД | `snake_case` | `price_kzt` |
| JSON API поля | `snake_case` | `"stock_after": 8` |
| URL paths | `kebab-case`, мн.ч. | `/car-makes` |
| Slug | `kebab-case`, ASCII | `fara-levaya-toyota-camry-v50` |

### Naming (фронтенд)

| Сущность | Стиль | Пример |
|---|---|---|
| Компоненты, страницы | `PascalCase` | `PartCard.tsx` |
| Хуки | `camelCase` + `use` | `useFavorites.ts` |
| Утилиты | `camelCase` | `formatPrice.ts` |
| Константы | `UPPER_SNAKE` | `ROUTES.CATALOG` |
| CSS-переменные | `--kebab-case` | `--accent-hover` |
| Query keys | массив строк | `['parts', filters]` |

### Правила компонентов

- Один компонент = один файл. Максимум 200 строк — если больше, декомпозировать.
- Props-интерфейс всегда явный: `interface PartCardProps { part: Part; }`.
- `memo`, `useMemo`, `useCallback` — только при измеренной проблеме, не превентивно.
- Никаких `any`. Строгий режим TypeScript.

### Логи (бэкенд)

`structlog` → JSON в stdout → Cloud Logging. На каждый запрос: `request_id`, `actor_id`, `path`, `method`, `status`, `latency_ms`. Пароли, токены, PII — маскируются.

---

## 16. Security checklist

### Бэкенд
- [ ] HTTPS только. HSTS включён.
- [ ] CORS — whitelist доменов фронта.
- [ ] Пароли — argon2id.
- [ ] JWT secret 256-bit, в Secret Manager, ротация раз в год.
- [ ] Rate limit: `/auth/login` 5/мин · `/auth/refresh` 10/мин · `/favorites` 20/мин · `/parts` search 30/мин.
- [ ] SQLAlchemy ORM — никакого raw SQL с f-string.
- [ ] `stock` никогда не < 0 — `CHECK` в БД + проверка в сервисе.
- [ ] Все привилегированные роуты — `@require_role('admin')`. Default deny.
- [ ] Загрузка файлов — whitelist MIME, max 10 MB, отдельный GCS bucket.
- [ ] Audit log на все write-операции.
- [ ] `.env`, JSON-ключи — в `.gitignore`. Pre-commit hook: `detect-secrets`.
- [ ] Response headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, CSP.
- [ ] Логи не содержат паролей, токенов, PII.
- [ ] Backups Cloud SQL — ежедневно, retention 7 дней.
- [ ] Disaster recovery — задокументирована процедура восстановления.

### Фронтенд
- [ ] CSP — через Firebase Hosting headers.
- [ ] Никаких секретов в `VITE_*` переменных.
- [ ] `dangerouslySetInnerHTML` — только с DOMPurify.
- [ ] CSRF: JWT в header — защищён по умолчанию.
- [ ] Access token в памяти (Zustand), не `localStorage` — в v2.

---

## 17. Roadmap / Milestones

### Бэкенд

#### M1 — Foundation (1 неделя)
- [ ] Репозиторий, скелет, CI lint+test.
- [ ] Docker Compose локально (Postgres).
- [ ] Application factory, extensions, config.
- [ ] Health endpoints.
- [ ] Модели User + миграция. Seed-admin CLI.
- [ ] JWT auth (login/refresh/me).
- [ ] Деплой staging на Cloud Run.

#### M2 — Каталог (1.5 недели)
- [ ] Модели: CarMake, CarModel, CarGeneration, Category.
- [ ] Модель Part + PartImage. CRUD API.
- [ ] Загрузка фото в GCS.
- [ ] Публичный список + детальная карточка.
- [ ] Полнотекстовый поиск (tsvector + триггер).
- [ ] Фильтрация по марке/модели/категории/цене/состоянию.

#### M3 — Склад и избранное (1 неделя)
- [ ] `stock_service`: increase / decrease / set (atomic).
- [ ] `favorite_service`: лимиты слотов, `get_favorite_slots()`.
- [ ] API избранного.
- [ ] Admin API управления остатками.
- [ ] Тесты граничных случаев.

#### M4 — Полировка (1 неделя)
- [ ] `/api/v1/config` с телефоном и часами.
- [ ] Audit log.
- [ ] Rate limiting, CORS, security headers.
- [ ] OpenAPI-снимок, CI-контракт.
- [ ] Backups, Cloud Monitoring.

### Фронтенд (параллельно с M2–M3 бэкенда)

#### F1 — Скелет (3 дня)
- [ ] Vite + React + TS + Tailwind + ESLint.
- [ ] Дизайн-система: CSS-переменные, Button, Badge, Skeleton, Modal.
- [ ] Header, Footer, BottomNav.
- [ ] Роутер, lazy-load, 404.
- [ ] API client (axios + interceptors).
- [ ] Auth store + login/register.

#### F2 — Каталог (5 дней)
- [ ] `useParts` хук.
- [ ] `PartCard`, `PartCardSkeleton`.
- [ ] CatalogPage: sidebar (desktop) + BottomSheet (mobile).
- [ ] CarFilter каскадный, CategoryFilter, PriceRange, Condition.
- [ ] SortBar, ActiveFilters, Pagination.

#### F3 — Карточка и поиск (3 дня)
- [ ] PartPage: Swiper-галерея, PartInfo, RelatedParts.
- [ ] FavoriteBlock + FavoriteSlotBar.
- [ ] CallBlock + StickyCallBar.
- [ ] SearchBar + SearchDropdown (debounce).
- [ ] SearchPage.

#### F4 — Избранное и Auth (3 дня)
- [ ] `useFavorites` с optimistic update.
- [ ] FavoritesPage.
- [ ] Auth guards + редирект `?next=`.
- [ ] ProfilePage.

#### F5 — Админ-панель (5 дней)
- [ ] AdminLayout.
- [ ] DashboardPage.
- [ ] PartsListPage (таблица + поиск).
- [ ] PartFormPage (форма + ImageUploadZone + CarCompatibility).
- [ ] StockPage + StockChangeModal.

#### F6 — Полировка (3 дня)
- [ ] SEO: react-helmet-async, OpenGraph, sitemap.
- [ ] Lighthouse ≥ 85 (mobile).
- [ ] E2E тесты Playwright.
- [ ] Firebase Hosting деплой.
- [ ] Прод-релиз.

### Backlog (после v1)
- WhatsApp / Telegram кнопка «Написать по запчасти».
- История просмотров (localStorage).
- Сравнение запчастей (до 3 позиций).
- Уведомление при изменении статуса избранной запчасти.
- Мульти-валютность (KZT / RUB / USD).
- Импорт каталога из Excel.
- i18n (ru / kk).
- PWA + иконка на домашнем экране.
- Dark/Light переключатель (сейчас только dark).
- Партнёрские разборки (мультимагазин).

---

## 18. Контакты и ответственные

| Зона | Owner |
|---|---|
| Backend lead | _TBD_ |
| Frontend lead | _TBD_ |
| DevOps / GCP | _TBD_ |
| Контент / склад | Администратор магазина |

---

## 19. Open questions

1. **Телефон** — один номер или несколько (основной + WhatsApp отдельно)? Пока один через env `CONTACT_PHONE`.
2. **Refresh token** — httpOnly cookie (безопаснее, требует CORS credentials) или localStorage (проще)? Рекомендую cookie, но требует настройки бэка.
3. **Infinite scroll vs пагинация** — infinite scroll лучше на мобиле, хуже для SEO. Решение: пагинация с `?page=N` в URL.
4. **Авторизация** — нужна ли обязательная регистрация для избранного, или разрешить гостям (localStorage)? Рекомендую JWT, но каталог без входа.
5. **Изображения** — один размер + CSS `object-fit` (v1) или несколько размеров (thumbnail / medium / full)?
6. **Markdown в описании** — plain text или markdown? Если markdown — `react-markdown` + DOMPurify.
7. **Аналитика** — Google Analytics или Yandex Metrica (популярнее в СНГ)? Оба через GTM.
8. **Регион Cloud Run** — `europe-west3` (Франкфурт) или `asia-southeast1` (Сингапур)? Выбрать после тестирования latency из Алматы.

---

**Версия документа:** v1.0 — 2026-05-17
**Последнее изменение:** изначальный draft.
