import { defineConfig } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:3000";
const adminBaseUrl = "http://127.0.0.1:5180";
const customerBaseUrl = "http://127.0.0.1:5181";
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
            PORT: "3000",
            DATABASE_URL: "postgres://postgres:postgres@localhost:5432/organization_assistant_db"
          }
        },
        {
          command:
            "node ../admin-web-app/node_modules/vite/bin/vite.js ../admin-web-app --host 127.0.0.1 --port 5180 --strictPort",
          url: adminBaseUrl,
          reuseExistingServer: true,
          timeout: 120_000,
          env: {
            VITE_API_BASE_URL: apiBaseUrl
          }
        },
        {
          command:
            "node ../customer-portal-webapp/node_modules/vite/bin/vite.js ../customer-portal-webapp --host 127.0.0.1 --port 5181 --strictPort",
          url: customerBaseUrl,
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
      name: "customer-login",
      use: {
        baseURL: customerBaseUrl
      },
      testMatch: /customer-login\.spec\.ts/
    }
  ]
});
