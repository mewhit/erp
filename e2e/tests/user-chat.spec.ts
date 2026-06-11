import { expect, test } from "@playwright/test";
import {
  addUserToOrganization,
  deleteOrganizationUserRole,
  deleteUser,
  getDefaultOrganization,
  getRoleByCode,
  testPassword
} from "./login-fixtures";

test("two users in the same organization can chat and reload persisted messages", async ({
  browser,
  request
}) => {
  const organization = await getDefaultOrganization(request);
  const userRole = await getRoleByCode(request, "USER");
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userAInput = {
    name: `E2E Chat User A ${uniqueId}`,
    email: `e2e-chat-a-${uniqueId}@example.com`,
    password: testPassword
  };
  const userBInput = {
    name: `E2E Chat User B ${uniqueId}`,
    email: `e2e-chat-b-${uniqueId}@example.com`,
    password: testPassword
  };
  const userA = await addUserToOrganization(request, {
    user: userAInput,
    organizationId: organization.id,
    roleId: userRole.id
  });
  const userB = await addUserToOrganization(request, {
    user: userBInput,
    organizationId: organization.id,
    roleId: userRole.id
  });

  const contextA = await browser.newContext();
  let contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  let pageB = await contextB.newPage();

  try {
    await login(pageA, userAInput.email);
    await login(pageB, userBInput.email);

    await pageA.getByRole("link", { name: "Chat" }).click();
    await pageB.getByRole("link", { name: "Chat" }).click();

    await expect(
      pageA.getByRole("heading", { name: "Chat", level: 1, exact: true })
    ).toBeVisible();
    await expect(
      pageB.getByRole("heading", { name: "Chat", level: 1, exact: true })
    ).toBeVisible();
    await expect(pageA.getByText("Connected")).toBeVisible();
    await expect(pageB.getByText("Connected")).toBeVisible();

    await pageA.getByRole("button", { name: userBInput.name }).click();
    await pageB.getByRole("button", { name: userAInput.name }).click();
    await expect(pageA.getByRole("heading", { name: userBInput.name })).toBeVisible();
    await expect(pageB.getByRole("heading", { name: userAInput.name })).toBeVisible();

    const messageFromA = `Hello from A ${uniqueId}`;
    const messageFromB = `Hello from B ${uniqueId}`;

    await pageA.locator("textarea").fill(messageFromA);
    await pageA.getByRole("button", { name: "Send" }).click();

    await expect(pageB.getByText(messageFromA)).toBeVisible();
    await expect(pageA.getByText(messageFromA)).toBeVisible();
    await expect(pageA.getByText("Delivered")).toBeVisible();

    await contextB.close();
    contextB = await browser.newContext();
    pageB = await contextB.newPage();
    await login(pageB, userBInput.email);
    await pageB.getByRole("link", { name: "Chat" }).click();
    await expect(
      pageB.getByRole("heading", { name: "Chat", level: 1, exact: true })
    ).toBeVisible();
    await expect(pageB.getByText("Connected")).toBeVisible();
    await pageB.getByRole("button", { name: userAInput.name }).click();
    await expect(pageB.getByText(messageFromA)).toBeVisible();

    await pageB.locator("textarea").fill(messageFromB);
    await pageB.getByRole("button", { name: "Send" }).click();

    await expect(pageA.getByText(messageFromB)).toBeVisible();
    await expect(pageB.getByText(messageFromB)).toBeVisible();
    await expect(pageB.getByText("Delivered")).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
    await deleteOrganizationUserRole(request, userA.organizationUserRole.id);
    await deleteOrganizationUserRole(request, userB.organizationUserRole.id);
    await deleteUser(request, userA.user.id);
    await deleteUser(request, userB.user.id);
  }
});

async function login(
  page: import("@playwright/test").Page,
  email: string
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(testPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}
