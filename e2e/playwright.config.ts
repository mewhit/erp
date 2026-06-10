import { defineConfig } from "@playwright/test";
import { getRequiredEnv } from "./env";

const apiBaseUrl = getRequiredEnv("API_BASE_URL");
const adminBaseUrl = getRequiredEnv("ADMIN_BASE_URL");
const userBaseUrl = getRequiredEnv("USER_BASE_URL");
const apiPort = getRequiredEnv("API_PORT");
const adminHost = getRequiredEnv("ADMIN_HOST");
const adminPort = getRequiredEnv("ADMIN_PORT");
const userHost = getRequiredEnv("USER_HOST");
const userPort = getRequiredEnv("USER_PORT");
const databaseUrl = getRequiredEnv("DATABASE_URL");
const shouldStartWebServers = process.env.PLAYWRIGHT_START_WEBSERVER === "1";

export default defineConfig({
  testDir: "./tests",
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
          command: "node ../http-server/node_modules/tsx/dist/cli.mjs ../http-server/src/main.ts",
          url: `${apiBaseUrl}/health-check`,
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            PORT: apiPort,
            DATABASE_URL: databaseUrl,
            API_CLIENT_BASE_URL: apiBaseUrl
          }
        },
        {
          command:
            `node ../admin-web-app/node_modules/vite/bin/vite.js ../admin-web-app --host ${adminHost} --port ${adminPort} --strictPort`,
          url: adminBaseUrl,
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            VITE_API_BASE_URL: apiBaseUrl
          }
        },
        {
          command:
            `node ../user-portal-webapp/node_modules/vite/bin/vite.js ../user-portal-webapp --host ${userHost} --port ${userPort} --strictPort`,
          url: userBaseUrl,
          reuseExistingServer: true,
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
      name: "customer-work-order-item",
      use: {
        baseURL: adminBaseUrl
      },
      testMatch: /customer-work-order-item\.spec\.ts/
    }
  ]
});
