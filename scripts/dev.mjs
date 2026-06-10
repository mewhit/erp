import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const parseEnvLine = (line) => {
  const trimmed = line.trim()

  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return undefined
  }

  const separatorIndex = trimmed.indexOf("=")

  if (separatorIndex <= 0) {
    return undefined
  }

  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return [key, value]
}

const readEnvFile = (relativePath) => {
  const envPath = resolve(process.cwd(), relativePath)

  if (!existsSync(envPath)) {
    return {}
  }

  const env = {}
  const envFile = readFileSync(envPath, "utf8")

  for (const line of envFile.split(/\r?\n/)) {
    const entry = parseEnvLine(line)

    if (entry) {
      const [key, value] = entry
      env[key] = value
    }
  }

  return env
}

const createEnv = (relativePath) => ({
  ...readEnvFile(relativePath),
  ...process.env
})

const getRequiredEnv = (env, key) => {
  const value = env[key]?.trim()

  if (!value) {
    throw new Error(`${key} must be set in the app .env or environment`)
  }

  return value
}

const getEnv = (env, key, fallback) => {
  const value = env[key]?.trim()
  return value ? value : fallback
}

const yarn = process.platform === "win32" ? "yarn.cmd" : "yarn"
const apiEnv = createEnv("http-server/.env")
const adminEnv = createEnv("admin-web-app/.env")
const portalEnv = createEnv("user-portal-webapp/.env")

const apiPort = getRequiredEnv(apiEnv, "PORT")
const adminApiBaseUrl = getRequiredEnv(adminEnv, "VITE_API_BASE_URL")
const portalApiBaseUrl = getRequiredEnv(portalEnv, "VITE_API_BASE_URL")
const apiClientBaseUrl = getEnv(apiEnv, "API_CLIENT_BASE_URL", adminApiBaseUrl)

const commands = [
  {
    name: "api",
    args: ["workspace", "erp-effect-http-server", "dev"],
    env: {
      ...apiEnv,
      API_CLIENT_BASE_URL: apiClientBaseUrl
    }
  },
  {
    name: "admin",
    args: [
      "workspace",
      "admin-web-app",
      "dev",
      "--host",
      getRequiredEnv(adminEnv, "DEV_HOST"),
      "--port",
      getRequiredEnv(adminEnv, "DEV_PORT"),
      "--strictPort"
    ],
    env: {
      ...adminEnv,
      VITE_API_BASE_URL: adminApiBaseUrl
    }
  },
  {
    name: "portal",
    args: [
      "workspace",
      "user-portal-webapp",
      "dev",
      "--host",
      getRequiredEnv(portalEnv, "DEV_HOST"),
      "--port",
      getRequiredEnv(portalEnv, "DEV_PORT"),
      "--strictPort"
    ],
    env: {
      ...portalEnv,
      VITE_API_BASE_URL: portalApiBaseUrl
    }
  }
]

const children = new Set()
let stopping = false

const writePrefixed = (name, stream, chunk) => {
  const lines = chunk.toString().split(/\r?\n/)

  for (const line of lines) {
    if (line.length > 0) {
      stream.write(`[${name}] ${line}\n`)
    }
  }
}

const stopChild = (child) => {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore"
    })
    return
  }

  child.kill()
}

const stopChildren = () => {
  if (stopping) {
    return
  }

  stopping = true

  for (const child of children) {
    if (!child.killed) {
      stopChild(child)
    }
  }
}

for (const command of commands) {
  const child = spawn(yarn, command.args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...command.env
    },
    stdio: ["ignore", "pipe", "pipe"]
  })

  children.add(child)

  child.stdout.on("data", (chunk) => writePrefixed(command.name, process.stdout, chunk))
  child.stderr.on("data", (chunk) => writePrefixed(command.name, process.stderr, chunk))

  child.once("exit", (code, signal) => {
    children.delete(child)

    if (!stopping) {
      process.exitCode = code ?? (signal === null ? 0 : 1)
      stopChildren()
    }

    if (children.size === 0 && stopping) {
      process.exit()
    }
  })
}

process.once("SIGINT", stopChildren)
process.once("SIGTERM", stopChildren)
