import { expect, test } from "@playwright/test";
import {
  apiBaseUrl,
  createTestItem,
  deleteCustomer,
  deleteCustomerWorkOrder,
  deleteItem,
  deleteOrganizationCustomer,
  deleteWorkOrder,
  deleteWorkOrderItem,
  getDefaultOrganization,
  setupEmail,
  setupPassword,
  withApiAuth
} from "./login-fixtures";

type ApiListResponse<T> = {
  data: T[];
};

type ApiResponse<T> = {
  data: T;
};

type User = {
  id: string;
  name: string;
  email: string;
};

type Organization = {
  id: string;
  name: string;
  code: string;
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
  isActive: boolean;
  unitPriceCents: number;
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

test("user portal backend calls respond with the expected data contracts", async ({ request }) => {
  const loginResponse = await request.post(`${apiBaseUrl}/auth/login`, {
    data: {
      email: setupEmail,
      password: setupPassword
    }
  });
  expect(loginResponse.status(), await loginResponse.text()).toBe(200);

  const loginBody = (await loginResponse.json()) as ApiResponse<{ token: string }>;
  const authHeaders = {
    Authorization: `Bearer ${loginBody.data.token}`
  };

  const meResponse = await request.get(`${apiBaseUrl}/auth/me`, {
    headers: authHeaders
  });
  expect(meResponse.status(), await meResponse.text()).toBe(200);

  const meBody = (await meResponse.json()) as ApiResponse<{ userId: string }>;
  const userResponse = await request.get(`${apiBaseUrl}/users/${meBody.data.userId}`, {
    headers: authHeaders
  });
  expect(userResponse.status(), await userResponse.text()).toBe(200);

  const userBody = (await userResponse.json()) as ApiResponse<User>;
  expect(userBody.data.email).toBe(setupEmail);

  const organization = await getDefaultOrganization(request);
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdIds: {
    customerId?: string;
    customerWorkOrderId?: string;
    itemId?: string;
    organizationCustomerId?: string;
    workOrderId?: string;
    workOrderItemId?: string;
  } = {};

  try {
    const meOrganizationsResponse = await request.get(
      `${apiBaseUrl}/usecase/me/organizations`,
      await withApiAuth(request)
    );
    expect(meOrganizationsResponse.status(), await meOrganizationsResponse.text()).toBe(200);

    const meOrganizationsBody =
      (await meOrganizationsResponse.json()) as ApiListResponse<Organization>;
    expect(Array.isArray(meOrganizationsBody.data)).toBe(true);

    const addCustomerResponse = await request.post(`${apiBaseUrl}/usecases/add-customer`, {
      ...(await withApiAuth(request, {
        data: {
          organizationId: organization.id,
          customer: {
            firstName: "E2E",
            lastName: "Portal Customer",
            email: `e2e-portal-customer-${uniqueId}@example.com`,
            phone: "555-0199"
          }
        }
      }))
    });
    expect(addCustomerResponse.status(), await addCustomerResponse.text()).toBe(201);

    const addCustomerBody = (await addCustomerResponse.json()) as ApiResponse<AddCustomerResult>;
    createdIds.customerId = addCustomerBody.data.customer.id;
    createdIds.organizationCustomerId = addCustomerBody.data.organizationCustomer.id;

    const customersResponse = await request.get(`${apiBaseUrl}/customers/`, await withApiAuth(request));
    expect(customersResponse.status(), await customersResponse.text()).toBe(200);

    const customersBody = (await customersResponse.json()) as ApiListResponse<Customer>;
    expect(customersBody.data.some((customer) => customer.id === createdIds.customerId)).toBe(true);

    const customerResponse = await request.get(
      `${apiBaseUrl}/customers/${createdIds.customerId}`,
      await withApiAuth(request)
    );
    expect(customerResponse.status(), await customerResponse.text()).toBe(200);

    const customerBody = (await customerResponse.json()) as ApiResponse<Customer>;
    expect(customerBody.data.email).toBe(addCustomerBody.data.customer.email);

    const organizationCustomersResponse = await request.get(
      `${apiBaseUrl}/organization-customers/`,
      await withApiAuth(request)
    );
    expect(organizationCustomersResponse.status(), await organizationCustomersResponse.text()).toBe(200);

    const organizationCustomersBody =
      (await organizationCustomersResponse.json()) as ApiListResponse<OrganizationCustomer>;
    expect(
      organizationCustomersBody.data.some(
        (organizationCustomer) => organizationCustomer.id === createdIds.organizationCustomerId
      )
    ).toBe(true);

    const addWorkOrderResponse = await request.post(
      `${apiBaseUrl}/usecases/add-work-order-to-customer`,
      {
        ...(await withApiAuth(request, {
          data: {
            customerId: createdIds.customerId,
            workOrder: {
              organizationId: organization.id,
              number: `WO-PORTAL-${uniqueId}`,
              title: "E2E portal work order",
              description: "Work order created by user portal backend call coverage",
              status: "open"
            }
          }
        }))
      }
    );
    expect(addWorkOrderResponse.status(), await addWorkOrderResponse.text()).toBe(201);

    const addWorkOrderBody =
      (await addWorkOrderResponse.json()) as ApiResponse<AddWorkOrderToCustomerResult>;
    createdIds.workOrderId = addWorkOrderBody.data.workOrder.id;
    createdIds.customerWorkOrderId = addWorkOrderBody.data.customerWorkOrder.id;

    const workOrdersResponse = await request.get(`${apiBaseUrl}/work-orders/`, await withApiAuth(request));
    expect(workOrdersResponse.status(), await workOrdersResponse.text()).toBe(200);

    const workOrdersBody = (await workOrdersResponse.json()) as ApiListResponse<WorkOrder>;
    expect(workOrdersBody.data.some((workOrder) => workOrder.id === createdIds.workOrderId)).toBe(true);

    const workOrderResponse = await request.get(
      `${apiBaseUrl}/work-orders/${createdIds.workOrderId}`,
      await withApiAuth(request)
    );
    expect(workOrderResponse.status(), await workOrderResponse.text()).toBe(200);

    const workOrderBody = (await workOrderResponse.json()) as ApiResponse<WorkOrder>;
    expect(workOrderBody.data.customerId).toBe(createdIds.customerId);

    const item = await createTestItem(request, "portal-backend");
    createdIds.itemId = item.id;

    const itemsResponse = await request.get(`${apiBaseUrl}/items/`, await withApiAuth(request));
    expect(itemsResponse.status(), await itemsResponse.text()).toBe(200);

    const itemsBody = (await itemsResponse.json()) as ApiListResponse<Item>;
    expect(itemsBody.data.some((listItem) => listItem.id === item.id && listItem.isActive)).toBe(true);

    const addItemResponse = await request.post(
      `${apiBaseUrl}/usecase/work-order/${createdIds.workOrderId}/add-items`,
      {
        ...(await withApiAuth(request, {
          data: {
            itemId: item.id,
            description: "E2E portal backend item",
            quantity: 4,
            unitPriceCents: item.unitPriceCents
          }
        }))
      }
    );
    expect(addItemResponse.status(), await addItemResponse.text()).toBe(200);

    const addItemBody = (await addItemResponse.json()) as ApiResponse<WorkOrderItem>;
    createdIds.workOrderItemId = addItemBody.data.id;
    expect(addItemBody.data.quantity).toBe(4);

    const workOrderItemsResponse = await request.get(
      `${apiBaseUrl}/work-order-items/`,
      await withApiAuth(request)
    );
    expect(workOrderItemsResponse.status(), await workOrderItemsResponse.text()).toBe(200);

    const workOrderItemsBody =
      (await workOrderItemsResponse.json()) as ApiListResponse<WorkOrderItem>;
    expect(
      workOrderItemsBody.data.some((workOrderItem) => workOrderItem.id === createdIds.workOrderItemId)
    ).toBe(true);

    const setQuantityResponse = await request.post(
      `${apiBaseUrl}/usecase/work-order/${createdIds.workOrderId}/set-item-quantity`,
      {
        ...(await withApiAuth(request, {
          data: {
            workOrderItemId: createdIds.workOrderItemId,
            quantity: 3
          }
        }))
      }
    );
    expect(setQuantityResponse.status(), await setQuantityResponse.text()).toBe(200);

    const setQuantityBody =
      (await setQuantityResponse.json()) as ApiResponse<{
        workOrderItemId: string;
        removed: boolean;
        quantity: number;
      }>;
    expect(setQuantityBody.data).toMatchObject({
      workOrderItemId: createdIds.workOrderItemId,
      removed: false,
      quantity: 3
    });

    const removeItemResponse = await request.post(
      `${apiBaseUrl}/usecase/work-order/${createdIds.workOrderId}/remove-items`,
      {
        ...(await withApiAuth(request, {
          data: {
            workOrderItemId: createdIds.workOrderItemId,
            quantity: 1
          }
        }))
      }
    );
    expect(removeItemResponse.status(), await removeItemResponse.text()).toBe(200);

    const removeItemBody =
      (await removeItemResponse.json()) as ApiResponse<{
        workOrderItemId: string;
        removed: boolean;
        remainingQuantity: number;
      }>;
    expect(removeItemBody.data).toMatchObject({
      workOrderItemId: createdIds.workOrderItemId,
      removed: false,
      remainingQuantity: 2
    });

    const setStatusResponse = await request.post(
      `${apiBaseUrl}/usecase/work-order/${createdIds.workOrderId}/set-status`,
      {
        ...(await withApiAuth(request, {
          data: {
            status: "in_progress"
          }
        }))
      }
    );
    expect(setStatusResponse.status(), await setStatusResponse.text()).toBe(200);

    const setStatusBody = (await setStatusResponse.json()) as ApiResponse<WorkOrder>;
    expect(setStatusBody.data.status).toBe("in_progress");
  } finally {
    if (createdIds.workOrderItemId !== undefined) {
      await deleteWorkOrderItem(request, createdIds.workOrderItemId);
    }
    if (createdIds.customerWorkOrderId !== undefined) {
      await deleteCustomerWorkOrder(request, createdIds.customerWorkOrderId);
    }
    if (createdIds.workOrderId !== undefined) {
      await deleteWorkOrder(request, createdIds.workOrderId);
    }
    if (createdIds.organizationCustomerId !== undefined) {
      await deleteOrganizationCustomer(request, createdIds.organizationCustomerId);
    }
    if (createdIds.customerId !== undefined) {
      await deleteCustomer(request, createdIds.customerId);
    }
    if (createdIds.itemId !== undefined) {
      await deleteItem(request, createdIds.itemId);
    }
  }
});
