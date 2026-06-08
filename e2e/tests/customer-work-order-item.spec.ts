import { expect, test } from "@playwright/test";
import {
  addCustomerToOrganization,
  addItemToWorkOrder,
  addWorkOrderToCustomer,
  createTestItem,
  deleteCustomer,
  deleteCustomerWorkOrder,
  deleteItem,
  deleteOrganizationCustomer,
  deleteWorkOrder,
  deleteWorkOrderItem,
  getDefaultOrganization,
  getWorkOrderItem
} from "./login-fixtures";

test("can add an item to a customer work order", async ({ request }) => {
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
    const customerResult = await addCustomerToOrganization(request, {
      organizationId: organization.id,
      customer: {
        firstName: "E2E",
        lastName: "Work Order Customer",
        email: `e2e-work-order-customer-${uniqueId}@example.com`,
        phone: "555-0101"
      }
    });
    createdIds.customerId = customerResult.customer.id;
    createdIds.organizationCustomerId = customerResult.organizationCustomer.id;

    const workOrderResult = await addWorkOrderToCustomer(request, {
      customerId: customerResult.customer.id,
      workOrder: {
        organizationId: organization.id,
        number: `WO-E2E-${uniqueId}`,
        title: "E2E customer work order",
        description: "Work order created by e2e test",
        status: "open"
      }
    });
    createdIds.workOrderId = workOrderResult.workOrder.id;
    createdIds.customerWorkOrderId = workOrderResult.customerWorkOrder.id;

    const item = await createTestItem(request, "work-order");
    createdIds.itemId = item.id;

    const workOrderItem = await addItemToWorkOrder(request, {
      workOrderId: workOrderResult.workOrder.id,
      itemId: item.id,
      description: "E2E item added to customer work order",
      quantity: 3,
      unitPriceCents: item.unitPriceCents
    });
    createdIds.workOrderItemId = workOrderItem.id;

    expect(workOrderResult.workOrder.customerId).toBe(customerResult.customer.id);
    expect(workOrderResult.customerWorkOrder.customerId).toBe(customerResult.customer.id);
    expect(workOrderResult.customerWorkOrder.workOrderId).toBe(workOrderResult.workOrder.id);
    expect(workOrderItem.workOrderId).toBe(workOrderResult.workOrder.id);
    expect(workOrderItem.itemId).toBe(item.id);
    expect(workOrderItem.quantity).toBe(3);
    expect(workOrderItem.unitPriceCents).toBe(item.unitPriceCents);

    const persistedWorkOrderItem = await getWorkOrderItem(request, workOrderItem.id);
    expect(persistedWorkOrderItem.workOrderId).toBe(workOrderResult.workOrder.id);
    expect(persistedWorkOrderItem.itemId).toBe(item.id);
    expect(persistedWorkOrderItem.description).toBe("E2E item added to customer work order");
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
