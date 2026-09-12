# Expense Tracker

Personal finance app: track income and expenses, set category budgets, automate recurring payments, and review stats on a dashboard.

The stack is a **NestJS** API (`server/`) and a **React + Vite** client (`client/`). Data lives in **PostgreSQL**. **Redis** is used for response caching and for a **BullMQ** queue that generates due recurring transactions.

## Deployment

Live demo:
- **Frontend**: https://expense-tracker-kate18.vercel.app
- **Backend / Swagger**: https://expense-tracker-fbo4.onrender.com/api

Hosted on the free tiers of three separate providers

| Layer      | Provider | Notes |
|------------|----------|-------|
| Frontend   | [Vercel](https://vercel.com) | Auto-deploys from `client/` on push |
| Backend    | [Render](https://render.com) | Docker web service, auto-deploys from `server/` on push |
| PostgreSQL | [Neon](https://neon.tech) | Serverless Postgres, connection via `PGHOST`/`PGUSER`/`PGPASSWORD` env vars with SSL |
| Redis      | Render Key Value | Free instance, same region as the backend for internal networking |

## Features

- JWT auth (register, login, refresh)
- Categories, transactions, and tags
- Monthly budgets with spent / remaining / usage %
- Recurring templates (daily / weekly / monthly)
  - Automatic generation every minute via BullMQ
  - Manual **Generate now** on the Recurring page (`POST /recurring/generate`)
- Dashboard: period summary, monthly dynamics, top expense categories
- CSV / JSON import and export
- Redis cache (15s TTL) for heavy aggregations:
  - `GET /stats/*`
  - `GET /budgets/summary`
  - `GET /summary`

## Architecture

```
client (Vite, :5173)
        │
        ▼
API (NestJS, :3000) ── PostgreSQL (:5433 host / :5432 in Docker)
        │
        └── Redis (:6379)
              ├── cache (stats, budget summary, period summary)
              └── BullMQ queue `recurring` (keys `bull:recurring:*`)
```

Swagger UI: [http://localhost:3000/api](http://localhost:3000/api)

## Prerequisites

- Node.js 20+ (API Docker image uses Node 22)
- Docker Desktop (Postgres, Redis, and optionally the API)
- npm

## Quick start with Docker

From the **repository root** (`D:\expense-tracker` / project root), create a `.env` file. Docker Compose reads this file (not `server/.env`):

```env
PGHOST=localhost
PGPORT=5433
PGUSER=user
PGPASSWORD=password
PGDATABASE=expense_tracker
```

Start everything:

```bash
docker compose up --build -d
```

| Service    | Container                 | Host port |
|------------|---------------------------|-----------|
| API        | `expense_tracker_api`     | 3000      |
| PostgreSQL | `expense_tracker_db`      | 5433 → 5432 |
| Redis      | `expense_tracker_redis`   | 6379      |

After code changes, rebuild the API image (Compose will otherwise keep an old cached image):

```bash
docker compose up --build -d
```

Postgres credentials in `.env` must match the ones used when the volume was first created. Changing `PGUSER` / `PGPASSWORD` later without recreating the volume causes `password authentication failed`.

## Local development

### 1. Infrastructure

You can run only Postgres and Redis in Docker and the API on the host:

```bash
docker compose up -d db redis
```

### 2. API

```bash
cd server
cp .env.example .env
npm ci
npm run start:dev
```

`server/.env` (typical local values):

```env
PGHOST=localhost
PGPORT=5433
PGUSER=user
PGPASSWORD=password
PGDATABASE=expense_tracker
PORT=3000
JWT_SECRET=your-access-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
REDIS_HOST=localhost
REDIS_PORT=6379
```

Inside Compose, the API uses `REDIS_HOST=redis` and `PGHOST=db` automatically.

### 3. Client

```bash
cd client
npm ci
npm run dev
```

The Vite app uses `VITE_API_URL=http://localhost:3000` (see `client/.env.development`). Open [http://localhost:5173](http://localhost:5173).

Register a user on `/login`, then use Dashboard, Categories, Transactions, Budgets, Recurring, and Import / Export.

## Redis

### Cache

After an authenticated call such as `GET /stats/monthly?months=6`:

```bash
docker exec -it expense_tracker_redis redis-cli KEYS "stats:*"
docker exec -it expense_tracker_redis redis-cli KEYS "budgets:summary:*"
```

TTL is **15 seconds**. Empty `KEYS *` right after a request usually means the API process is an old Docker image without the Redis cache, or the key already expired.

### Recurring queue (BullMQ)

On API startup the worker registers a repeatable job `generate-due` (every 60 seconds). Expected keys:

```bash
docker exec -it expense_tracker_redis redis-cli KEYS "bull:recurring:*"
```

Example:

```
bull:recurring:repeat
bull:recurring:repeat:generate-due
bull:recurring:delayed
bull:recurring:meta
```

These keys are **queue metadata**, not transactions. Created payments are rows in PostgreSQL (`transactions.recurringId`).

To test automation: create an active recurring template with `nextRunAt` in the past, wait up to one minute (or click **Generate now**). Check API logs for `Generated N recurring transaction(s)`.

BullMQ 6 requires the `ioredis` package (already listed in `server/package.json`).

## API overview

All business endpoints except auth require `Authorization: Bearer <accessToken>`.

| Area        | Base path        | Notes |
|-------------|------------------|--------|
| Auth        | `/auth`          | `POST /register`, `/login`, `/refresh` |
| Categories  | `/categories`    | CRUD |
| Transactions| `/transactions`  | CRUD, import, export |
| Budgets     | `/budgets`       | CRUD + `GET /budgets/summary?month=YYYY-MM` |
| Recurring   | `/recurring`     | CRUD + `POST /recurring/generate` |
| Summary     | `/summary`       | Income / expense / balance |
| Stats       | `/stats`         | By category, monthly, top categories |
| Tags        | `/tags`          | CRUD + stats |

`POST /recurring/generate` still returns `{ count, transactions }` for the **current user** so the web client keeps working. The worker runs the same generation for **all users**.

## Tests

From `server/`:

```bash
npm test
npm run test:e2e
```

## Scripts

**API (`server/`)**

| Script            | Description        |
|-------------------|--------------------|
| `npm run start:dev` | Watch mode       |
| `npm run build`   | Compile            |
| `npm run start:prod` | `node dist/main.js` |
| `npm test`        | Jest unit tests    |
| `npm run lint`    | ESLint             |

**Client (`client/`)**

| Script         | Description   |
|----------------|---------------|
| `npm run dev`  | Vite dev server |
| `npm run build`| Production build |

## Docker on Windows

`npm ci` inside the Linux image must match `package-lock.json`. If Compose fails with a lockfile sync error, regenerate the lockfile in Linux, then reinstall on Windows:

```powershell
cd server
docker run --rm -v ${PWD}:/app -w /app node:22-alpine sh -c "npm install"
Remove-Item -Recurse -Force node_modules
npm ci
```

Then rebuild: `docker compose up --build -d` from the repo root.

## Project layout

```
expense-tracker/
├── docker-compose.yml
├── client/                 # React UI
└── server/                 # NestJS API
    ├── Dockerfile
    ├── .env.example
    └── src/
        ├── auth/
        ├── budgets/
        ├── categories/
        ├── common/         # Redis cache module
        ├── import-export/
        ├── recurring/      # CRUD + BullMQ processor/scheduler
        ├── stats/
        ├── summary/
        ├── tags/
        ├── transactions/
        └── users/
```
