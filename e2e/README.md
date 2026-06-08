# ERP E2E Tests

Playwright tests cover login for the admin app and user portal.

## Run

```powershell
npm.cmd install
npm.cmd run test
```

The test script starts the API on `3000`, admin app on `5180`, and user portal on `5181`, then stops the processes when the run finishes.

Postgres must be available at:

```text
postgres://postgres:postgres@localhost:5432/organization_assistant_db
```

The repo's `docker-compose.yml` provides that database.
