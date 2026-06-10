import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const appDir = dirname(fileURLToPath(import.meta.url));

const getOptionalEnv = (env: Record<string, string>, key: string): string | undefined => {
  const value = env[key]?.trim();
  return value ? value : undefined;
};

const getOptionalPort = (env: Record<string, string>, key: string): number | undefined => {
  const value = getOptionalEnv(env, key);
  return value === undefined ? undefined : Number(value);
};

const getServerConfig = (env: Record<string, string>) => {
  const host = getOptionalEnv(env, "DEV_HOST");
  const port = getOptionalPort(env, "DEV_PORT");

  return {
    ...(host === undefined ? {} : { host }),
    ...(port === undefined ? {} : { port })
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appDir, "");

  return {
    envDir: appDir,
    plugins: [react(), tailwindcss()],
    server: getServerConfig(env)
  };
});
