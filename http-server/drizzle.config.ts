import { defineConfig } from "drizzle-kit"
import { getRequiredEnv } from "./src/env.js"

const connectionString = getRequiredEnv("DATABASE_URL")

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString
  }
})
