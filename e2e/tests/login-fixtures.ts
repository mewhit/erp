import { expect, type APIRequestContext } from "@playwright/test";

export const apiBaseUrl = "http://127.0.0.1:3020";
export const testPassword = "Playwright-login-2026!";

type ApiListResponse<T> = {
  data: T[];
};

type Organization = {
  id: string;
  name: string;
  code: string;
};

type Role = {
  id: string;
  name: string;
  code: string;
};

type AddUserResult = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  organizationUserRole: {
    id: string;
    organizationId: string;
    userId: string;
    roleId: string;
  };
};

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

export async function getDefaultOrganization(request: APIRequestContext) {
  const response = await request.get(`${apiBaseUrl}/organizations/`);
  expect(response.status(), await response.text()).toBe(200);

  const body = (await response.json()) as ApiListResponse<Organization>;
  expect(body.data.length).toBeGreaterThan(0);

  return body.data[0];
}

export async function getRoleByCode(request: APIRequestContext, code: string) {
  const response = await request.get(`${apiBaseUrl}/roles/`);
  expect(response.status(), await response.text()).toBe(200);

  const body = (await response.json()) as ApiListResponse<Role>;
  const role = body.data.find((item) => item.code === code);
  expect(role, `Role ${code} should exist`).toBeDefined();

  return role!;
}

export async function addUserToOrganization(
  request: APIRequestContext,
  input: {
    user: {
      name: string;
      email: string;
      password: string;
    };
    organizationId: string;
    roleId: string;
  }
) {
  const response = await request.post(`${apiBaseUrl}/usecases/add-user`, {
    data: input
  });

  expect(response.status(), await response.text()).toBe(201);

  const body = (await response.json()) as { data: AddUserResult };
  return body.data;
}

export async function deleteOrganizationUserRole(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/organization-user-roles/${id}`);
  expect([204, 404]).toContain(response.status());
}

export async function deleteUser(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/users/${id}`);
  expect([204, 404]).toContain(response.status());
}
