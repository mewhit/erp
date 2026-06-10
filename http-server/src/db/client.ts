import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { getRequiredEnv } from "../env.js"
import * as schema from "./schema.js"

const connectionString = getRequiredEnv("DATABASE_URL")

const client = postgres(connectionString, {
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10)
})

export const db = drizzle(client, { schema })

export const closeDb = (): Promise<void> => client.end()
