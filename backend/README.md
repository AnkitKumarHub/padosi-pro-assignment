# PadosiPro API (backend)

Express 5 + TypeScript API with Drizzle ORM and PostgreSQL. Serves **`/api/v1`** (auth, profile, tasks, task selection). OTP emails go to **Mailpit** in local development.

**Start here for the big picture:** [repository README](../README.md) (reviewer flow, architecture, APK).

## On this page

- [Run with Docker (recommended)](#run-with-docker-recommended)
- [Environment variables](#environment-variables)
- [Project layout](#project-layout)
- [Scripts](#scripts)
- [Errors and API shape](#errors-and-api-shape)

---

## Run with Docker (recommended)

Docker Compose is defined at the **repository root** (`../docker-compose.yml`). The API container expects a **root** `.env` file (not only `backend/.env`).

```bash
# from repository root
cp .env.example .env
# edit JWT_SECRET, OTP_SECRET (see below)
docker compose up --build
```

| Service | Host ports |
| --- | --- |
| postgres | 5432 |
| mailpit | SMTP 1025, UI 8025 |
| api | 3000 |

On startup the server runs **migrations** and **seeds the task catalogue** (`src/server.ts`). Reviewers do not run `drizzle-kit` manually for a normal run.

| URL | Purpose |
| --- | --- |
| http://localhost:3000/api/v1/health | Health + database check |
| http://localhost:3000/api/v1/docs | OpenAPI reference |

Stop: `Ctrl+C`, then `docker compose down`. Wipe DB volume: `docker compose down -v`.

---

## Environment variables

Copy [`.env.example`](../.env.example) to **`.env` at the repository root`** for Compose.

### Required for Docker Compose

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER` | Postgres role |
| `POSTGRES_PASSWORD` | Postgres password (local only) |
| `POSTGRES_DB` | Database name |
| `JWT_SECRET` | Signs login JWTs; **min 32 characters** |
| `OTP_SECRET` | HMAC key for OTP storage; **min 32 characters**, must differ from `JWT_SECRET` |
| `MAIL_FROM` | From address on OTP emails (non-empty) |

Compose sets inside the API container:

- `DATABASE_URL` -> `postgresql://...@postgres:5432/...`
- `SMTP_HOST=mailpit`, `SMTP_PORT=1025`, `PORT=3000`

Validation lives in `src/config.ts`. If the API container exits immediately, check Docker logs for `Invalid configuration` (missing or short secrets).

Generate secrets (run twice, use one value per secret):

```bash
openssl rand -base64 32
```

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Never commit `.env`.

### Optional: API on the host (`pnpm dev`)

Run Postgres and Mailpit in Docker, API with Node on your machine:

```bash
# repository root
docker compose up postgres mailpit -d
cd backend
pnpm install
pnpm dev
```

Use a `backend/.env` (or shell env) with:

| Variable | Typical local value |
| --- | --- |
| `DATABASE_URL` | `postgresql://padosi:...@localhost:5432/padosi` |
| `SMTP_HOST` | `localhost` |
| `SMTP_PORT` | `1025` |
| `JWT_SECRET` / `OTP_SECRET` / `MAIL_FROM` | Same rules as above |
| `PORT` | `3000` (default; change only if you update mobile **Server URL** to match) |

Do not run **both** the Docker `api` service and `pnpm dev` on the same port.

---

## Project layout

```text
src/
  app.ts              Express app, routes, OpenAPI registration
  server.ts           Migrate, seed, listen
  config.ts           Env validation (zod)
  modules/
    auth/             Register, OTP, login, JWT, /me
    profile/          Onboarding profile
    tasks/            Catalogue + task selection
  db/                 Drizzle schema, seed
  lib/                OTP, mailer, errors, clock
drizzle/              SQL migrations
Dockerfile            API image for Compose
```

---

## Scripts

```bash
pnpm install
pnpm run typecheck    # tsc --noEmit
pnpm dev              # node --watch src/server.ts
pnpm run db:generate  # drizzle-kit generate (schema changes)
```

Tests (when present): `pnpm test` from this directory.

---

## Errors and API shape

JSON errors follow a shared shape (`code`, `message`, optional `fields`). Codes are defined in the OpenAPI spec and handlers under `src/lib/errors.ts` and route modules. Use **/api/v1/docs** as the authoritative list of endpoints and response schemas when the server is running.

## Postman

With `docker compose up`, import from the repo root:

- [`postman/PadosiPro-API.postman_collection.json`](../postman/PadosiPro-API.postman_collection.json)
- [`postman/PadosiPro-Local.postman_environment.json`](../postman/PadosiPro-Local.postman_environment.json)

Select the **PadosiPro Local** environment. **Login** stores `accessToken`; paste the OTP from Mailpit into `otpCode` before **Verify email**. Change `testEmail` if register returns 409.
