import { expect, type APIRequestContext } from "@playwright/test";
import { getRequiredEnv } from "../env";

export const apiBaseUrl = getRequiredEnv("API_BASE_URL");
export const testPassword = "Playwright-login-2026!";
const setupEmail = process.env.E2E_SETUP_EMAIL ?? "mikewhittom27@gmail.com";
const setupPassword = process.env.E2E_SETUP_PASSWORD ?? "password123";

type ApiRequestOptions = {
  data?: unknown;
};

type ApiListResponse<T> = {
  data: T[];
};

type AuthSessionResponse = {
  data: {
    token: string;
  };
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

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type OrganizationCustomer = {
  id: string;
  organizationId: string;
  customerId: string;
};

type WorkOrder = {
  id: string;
  organizationId: string;
  customerId: string;
  number: string;
  title: string;
  description: string;
  status: string;
};

type CustomerWorkOrder = {
  id: string;
  customerId: string;
  workOrderId: string;
};

type Item = {
  id: string;
  name: string;
  sku: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
  isActive: boolean;
};

type WorkOrderItem = {
  id: string;
  workOrderId: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

type AddCustomerResult = {
  customer: Customer;
  organizationCustomer: OrganizationCustomer;
};

type AddWorkOrderToCustomerResult = {
  workOrder: WorkOrder;
  customerWorkOrder: CustomerWorkOrder;
};

async function getApiAuthHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  const response = await request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      email: setupEmail,
      password: setupPassword
    }
  });

  expect(response.status(), await response.text()).toBe(200);

  const body = (await response.json()) as AuthSessionResponse;
  return {
    Authorization: `Bearer ${body.data.token}`
  };
}

async function withApiAuth(
  request: APIRequestContext,
  options: ApiRequestOptions = {}
): Promise<ApiRequestOptions & { headers: Record<string, string> }> {
  return {
    ...options,
    headers: await getApiAuthHeaders(request)
  };
}

export async function createTestUser(request: APIRequestContext, portal: string) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = {
    name: `E2E ${portal} User`,
    email: `e2e-${portal}-${uniqueId}@example.com`,
    password: testPassword
  };

  const response = await request.post(`${apiBaseUrl}/usecase/users`, {
    ...(await withApiAuth(request, { data: user }))
  });

  expect(response.status(), await response.text()).toBe(201);

  return user;
}

export async function getDefaultOrganization(request: APIRequestContext) {
  const response = await request.get(`${apiBaseUrl}/organizations/`, await withApiAuth(request));
  expect(response.status(), await response.text()).toBe(200);

  const body = (await response.json()) as ApiListResponse<Organization>;
  expect(body.data.length).toBeGreaterThan(0);

  return body.data[0];
}

export async function getRoleByCode(request: APIRequestContext, code: string) {
  const response = await request.get(`${apiBaseUrl}/roles/`, await withApiAuth(request));
  expect(response.status(), await response.text()).toBe(200);

  const body = (await response.json()) as ApiListResponse<Role>;
  const role = body.data.find((item) => item.code === code);

  if (role !== undefined) {
    return role;
  }

  const name = code
    .toLowerCase()
    .replace(/(^|-)([a-z])/g, (_match, prefix: string, value: string) => `${prefix}${value.toUpperCase()}`);

  const createResponse = await request.post(`${apiBaseUrl}/roles/`, {
    ...(await withApiAuth(request, {
      data: {
        name,
        code
      }
    }))
  });
  expect(createResponse.status(), await createResponse.text()).toBe(201);

  const createBody = (await createResponse.json()) as { data: Role };
  return createBody.data;
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
  const response = await request.post(`${apiBaseUrl}/usecase/add-user`, {
    ...(await withApiAuth(request, { data: input }))
  });

  expect(response.status(), await response.text()).toBe(201);

  const body = (await response.json()) as { data: AddUserResult };
  return body.data;
}

export async function addCustomerToOrganization(
  request: APIRequestContext,
  input: {
    organizationId: string;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  }
) {
  const response = await request.post(`${apiBaseUrl}/usecases/add-customer`, {
    ...(await withApiAuth(request, { data: input }))
  });

  expect(response.status(), await response.text()).toBe(201);

  const body = (await response.json()) as { data: AddCustomerResult };
  return body.data;
}

export async function addWorkOrderToCustomer(
  request: APIRequestContext,
  input: {
    customerId: string;
    workOrder: {
      organizationId: string;
      number: string;
      title: string;
      description: string;
      status: string;
    };
  }
) {
  const response = await request.post(`${apiBaseUrl}/usecases/add-work-order-to-customer`, {
    ...(await withApiAuth(request, { data: input }))
  });

  expect(response.status(), await response.text()).toBe(201);

  const body = (await response.json()) as { data: AddWorkOrderToCustomerResult };
  return body.data;
}

export async function createTestItem(request: APIRequestContext, label: string) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const itemInput = {
    name: `E2E ${label} Item`,
    sku: `E2E_${label}_${uniqueId}`.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase(),
    description: `E2E ${label} item description`,
    unitPriceCents: 1299,
    quantity: 25
  };

  const response = await request.post(`${apiBaseUrl}/items/`, {
    ...(await withApiAuth(request, { data: itemInput }))
  });

  expect(response.status(), await response.text()).toBe(201);

  const body = (await response.json()) as { data: Item };
  return body.data;
}

export async function addItemToWorkOrder(
  request: APIRequestContext,
  input: {
    workOrderId: string;
    itemId: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
  }
) {
  const response = await request.post(`${apiBaseUrl}/work-order-items/`, {
    ...(await withApiAuth(request, { data: input }))
  });

  expect(response.status(), await response.text()).toBe(201);

  const body = (await response.json()) as { data: WorkOrderItem };
  return body.data;
}

export async function getWorkOrderItem(request: APIRequestContext, id: string) {
  const response = await request.get(`${apiBaseUrl}/work-order-items/${id}`, await withApiAuth(request));
  expect(response.status(), await response.text()).toBe(200);

  const body = (await response.json()) as { data: WorkOrderItem };
  return body.data;
}

export async function deleteOrganizationUserRole(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/organization-user-roles/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}

export async function deleteOrganizationCustomer(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/organization-customers/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}

export async function deleteCustomerWorkOrder(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/customer-work-orders/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}

export async function deleteWorkOrderItem(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/work-order-items/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}

export async function deleteWorkOrder(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/work-orders/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}

export async function deleteCustomer(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/customers/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}

export async function deleteItem(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/items/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}

export async function deleteUser(request: APIRequestContext, id: string) {
  const response = await request.delete(`${apiBaseUrl}/users/${id}`, await withApiAuth(request));
  expect([204, 404]).toContain(response.status());
}
