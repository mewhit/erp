# ERP E2E Tests

Playwright tests cover login for the admin app and user portal.

## Run

```powershell
npm.cmd install
npm.cmd run test
```

The test script reads the API, admin, portal, and database URLs from `e2e/.env`,
then stops the processes when the run finishes.

Postgres must be available at `DATABASE_URL`:

```text
postgres://postgres:postgres@127.0.0.1:5432/erp
```

The repo's `docker-compose.yml` provides that database.
