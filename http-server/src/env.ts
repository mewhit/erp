import { config } from "dotenv"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const moduleDir = dirname(fileURLToPath(import.meta.url))

const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(moduleDir, "../.env")
]

const envPath = envPaths.find((path) => existsSync(path))

if (envPath) {
  config({ path: envPath, override: false, quiet: true })
}

export const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim()

  if (value) {
    return value
  }

  throw new Error(`${key} must be set in the environment or .env`)
}
