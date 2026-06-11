import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(e2eDir, "..");

config({
  quiet: true,
  path: [
    resolve(e2eDir, ".env.local"),
    resolve(e2eDir, ".env"),
    resolve(repoRoot, ".env.local"),
    resolve(repoRoot, ".env"),
    resolve(repoRoot, "http-server", ".env.local"),
    resolve(repoRoot, "http-server", ".env"),
    resolve(repoRoot, "admin-web-app", ".env.local"),
    resolve(repoRoot, "admin-web-app", ".env"),
    resolve(repoRoot, "user-portal-webapp", ".env.local"),
    resolve(repoRoot, "user-portal-webapp", ".env")
  ]
});

export const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (value) {
    return value;
  }

  throw new Error(`${key} must be set in the environment or dotenv files`);
};
