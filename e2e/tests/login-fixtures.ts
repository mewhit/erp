import { expect, type APIRequestContext } from "@playwright/test";

export const apiBaseUrl = "http://127.0.0.1:3000";
export const testPassword = "Playwright-login-2026!";

export async function createTestUser(request: APIRequestContext, portal: string) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = {
    name: `E2E ${portal} User`,
    email: `e2e-${portal}-${uniqueId}@example.com`,
    password: testPassword
  };

  const response = await request.post(`${apiBaseUrl}/users/`, {
    data: user
  });

  expect(response.status(), await response.text()).toBe(201);

  return user;
}
