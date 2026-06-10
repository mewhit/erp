import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import "../env.js"
import * as schema from "./schema.js"

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@127.0.0.1:5432/erp"

const client = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10)
})

export const db = drizzle(client, { schema })

export const closeDb = (): Promise<void> => client.end()
