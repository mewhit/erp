import { migrate } from "drizzle-orm/postgres-js/migrator"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { closeDb, db } from "./client.js"

const currentDir = dirname(fileURLToPath(import.meta.url))
const migrationsFolder = resolve(currentDir, "../../db/migrations")

try {
  await migrate(db, {
    migrationsFolder,
    migrationsSchema: "drizzle"
  })

  console.log(`Applied database migrations from ${migrationsFolder}`)
} finally {
  await closeDb()
}
