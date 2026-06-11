import { defineConfig } from "@playwright/test";
import "./load-dotenv";

const getEnv = (key: string, fallback: string): string =>
  process.env[key]?.trim() || fallback;

const apiBaseUrl = getEnv("API_BASE_URL", "http://127.0.0.1:3100");
const adminBaseUrl = getEnv("ADMIN_BASE_URL", "http://127.0.0.1:5174");
const userBaseUrl = getEnv("USER_BASE_URL", "http://127.0.0.1:5175");
const apiPort = getEnv("API_PORT", "3100");
const adminHost = getEnv("ADMIN_HOST", "127.0.0.1");
const adminPort = getEnv("ADMIN_PORT", "5174");
const userHost = getEnv("USER_HOST", "127.0.0.1");
const userPort = getEnv("USER_PORT", "5175");
const databaseUrl = getEnv(
  "DATABASE_URL",
  "postgres://postgres:postgres@127.0.0.1:5432/erp"
);
const shouldStartWebServers = process.env.PLAYWRIGHT_START_WEBSERVER === "1";
const shouldReuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "1";

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  reporter: [["html"], ["list"]],
  use: {
    trace: "on-first-retry",
    channel: "chrome"
  },
  webServer: shouldStartWebServers
    ? [
        {
          command: "node ../node_modules/tsx/dist/cli.mjs ../http-server/src/main.ts",
          url: `${apiBaseUrl}/health-check`,
          reuseExistingServer: shouldReuseExistingServer,
          timeout: 120_000,
          env: {
            PORT: apiPort,
            DATABASE_URL: databaseUrl,
            API_CLIENT_BASE_URL: apiBaseUrl
          }
        },
        {
          command:
            `node ../node_modules/vite/bin/vite.js ../admin-web-app --host ${adminHost} --port ${adminPort} --strictPort`,
          url: adminBaseUrl,
          reuseExistingServer: shouldReuseExistingServer,
          timeout: 120_000,
          env: {
            VITE_API_BASE_URL: apiBaseUrl
          }
        },
        {
          command:
            `node ../node_modules/vite/bin/vite.js ../user-portal-webapp --host ${userHost} --port ${userPort} --strictPort`,
          url: userBaseUrl,
          reuseExistingServer: shouldReuseExistingServer,
          timeout: 120_000,
          env: {
            VITE_API_BASE_URL: apiBaseUrl
          }
        }
      ]
    : undefined,
  projects: [
    {
      name: "admin-login",
      use: {
        baseURL: adminBaseUrl
      },
      testMatch: /admin-login\.spec\.ts/
    },
    {
      name: "user-login",
      use: {
        baseURL: userBaseUrl
      },
      testMatch: /user-login\.spec\.ts/
    },
    {
      name: "user-add-user",
      use: {
        baseURL: userBaseUrl
      },
      testMatch: /user-add-user\.spec\.ts/
    },
    {
      name: "user-chat",
      use: {
        baseURL: userBaseUrl
      },
      testMatch: /user-chat\.spec\.ts/
    },
    {
      name: "user-portal-backend-calls",
      use: {
        baseURL: userBaseUrl
      },
      testMatch: /user-portal-backend-calls\.spec\.ts/
    },
    {
      name: "customer-work-order-item",
      use: {
        baseURL: adminBaseUrl
      },
      testMatch: /customer-work-order-item\.spec\.ts/
    }
  ]
});
