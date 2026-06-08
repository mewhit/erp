import { expect, test } from "@playwright/test";
import {
  addUserToOrganization,
  createTestUser,
  deleteOrganizationUserRole,
  deleteUser,
  getDefaultOrganization,
  getRoleByCode,
  testPassword
} from "./login-fixtures";

test("user can create a new user", async ({ page, request }) => {
  const user = await createTestUser(request, "user-creator");
  const organization = await getDefaultOrganization(request);
  const userRole = await getRoleByCode(request, "USER");
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const newUser = {
    name: "E2E User Created User",
    email: `e2e-user-created-${uniqueId}@example.com`,
    password: testPassword
  };

  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(testPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const result = await addUserToOrganization(request, {
    user: newUser,
    organizationId: organization.id,
    roleId: userRole.id
  });

  try {
    expect(result.user.email).toBe(newUser.email);
    expect(result.organizationUserRole.organizationId).toBe(organization.id);
    expect(result.organizationUserRole.userId).toBe(result.user.id);
    expect(result.organizationUserRole.roleId).toBe(userRole.id);

    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByLabel("Email").fill(newUser.email);
    await page.getByLabel("Password").fill(testPassword);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText(newUser.name)).toBeVisible();
  } finally {
    await deleteOrganizationUserRole(request, result.organizationUserRole.id);
    await deleteUser(request, result.user.id);
  }
});
