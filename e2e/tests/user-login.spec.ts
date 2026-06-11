import { expect, test } from "@playwright/test";
import { createTestUser, testPassword } from "./login-fixtures";

test("user can sign in", async ({ page, request }) => {
  const user = await createTestUser(request, "user");

  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(user.name)).toBeVisible();
});

test("user login shows an error for invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("missing-user@example.com");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});
