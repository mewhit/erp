# ERP E2E Tests

Playwright tests cover the admin app and user portal.

## Run

```powershell
npm.cmd install
npm.cmd run test
```

`npm.cmd run test` runs `playwright test` directly.

The Playwright config loads environment variables with `dotenv`.
Local values belong in `e2e/.env.local`; it is gitignored and has the default
local URLs/ports used by the apps:

```text
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/erp
API_BASE_URL=http://127.0.0.1:3100
ADMIN_BASE_URL=http://127.0.0.1:5174
USER_BASE_URL=http://127.0.0.1:5175
```

The config also reads `.env` / `.env.local` from the repo root and app folders,
with `e2e/.env.local` taking precedence.

By default Playwright starts fresh web servers. Set
`PLAYWRIGHT_REUSE_EXISTING_SERVER=1` only when you intentionally want to run
against already-running dev servers.

Postgres must be available at `DATABASE_URL`. The repo's `docker-compose.yml`
provides the default database:

```text
docker compose up -d postgres
```
