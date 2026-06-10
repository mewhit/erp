import { Data, Effect, Schema } from "effect";
import { getStoredSession } from "./auth";

const OrganizationSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  code: Schema.String,
  createdAt: Schema.String
});

const OrganizationsResponseSchema = Schema.Struct({
  data: Schema.Array(OrganizationSchema)
});

export type Organization = typeof OrganizationSchema.Type;

const CustomerSchema = Schema.Struct({
  id: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  email: Schema.String,
  phone: Schema.String,
  isActive: Schema.Boolean,
  createdAt: Schema.String
});

const OrganizationCustomerSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  customerId: Schema.String,
  createdAt: Schema.String
});

const AddCustomerResponseSchema = Schema.Struct({
  data: Schema.Struct({
    customer: CustomerSchema,
    organizationCustomer: OrganizationCustomerSchema
  })
});

export type Customer = typeof CustomerSchema.Type;

const CustomersResponseSchema = Schema.Struct({
  data: Schema.Array(CustomerSchema)
});

const CustomerResponseSchema = Schema.Struct({
  data: CustomerSchema
});

const OrganizationCustomersResponseSchema = Schema.Struct({
  data: Schema.Array(OrganizationCustomerSchema)
});

const WorkOrderSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  customerId: Schema.String,
  number: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: Schema.String,
  createdAt: Schema.String
});

const WorkOrdersResponseSchema = Schema.Struct({
  data: Schema.Array(WorkOrderSchema)
});

const WorkOrderResponseSchema = Schema.Struct({
  data: WorkOrderSchema
});

const SetWorkOrderStatusResponseSchema = Schema.Struct({
  data: WorkOrderSchema
});

const AddWorkOrderToCustomerResponseSchema = Schema.Struct({
  data: Schema.Struct({
    workOrder: WorkOrderSchema,
    customerWorkOrder: Schema.Struct({
      id: Schema.String,
      customerId: Schema.String,
      workOrderId: Schema.String,
      createdAt: Schema.String
    })
  })
});

export type WorkOrder = typeof WorkOrderSchema.Type;

const ItemSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  sku: Schema.String,
  description: Schema.String,
  unitPriceCents: Schema.Number,
  quantity: Schema.Number,
  isActive: Schema.Boolean,
  createdAt: Schema.String
});

const ItemsResponseSchema = Schema.Struct({
  data: Schema.Array(ItemSchema)
});

const WorkOrderItemSchema = Schema.Struct({
  id: Schema.String,
  workOrderId: Schema.String,
  itemId: Schema.String,
  description: Schema.String,
  quantity: Schema.Number,
  unitPriceCents: Schema.Number,
  createdAt: Schema.String
});

const WorkOrderItemsResponseSchema = Schema.Struct({
  data: Schema.Array(WorkOrderItemSchema)
});

const AddWorkOrderItemResponseSchema = Schema.Struct({
  data: WorkOrderItemSchema
});

const RemoveWorkOrderItemResponseSchema = Schema.Struct({
  data: Schema.Struct({
    workOrderItemId: Schema.String,
    removed: Schema.Boolean,
    remainingQuantity: Schema.Number
  })
});

const SetWorkOrderItemQuantityResponseSchema = Schema.Struct({
  data: Schema.Struct({
    workOrderItemId: Schema.String,
    removed: Schema.Boolean,
    quantity: Schema.Number
  })
});

export type Item = typeof ItemSchema.Type;
export type WorkOrderItem = typeof WorkOrderItemSchema.Type;

export type CustomerSummary = Customer & {
  organizationCustomerId: string;
};

export type CustomerDetails = {
  customer: Customer;
  workOrders: ReadonlyArray<WorkOrder>;
};

export type WorkOrderItemLine = WorkOrderItem & {
  item: Item | undefined;
};

export type WorkOrderDetails = {
  workOrder: WorkOrder;
  customer: Customer;
  items: ReadonlyArray<Item>;
  workOrderItems: ReadonlyArray<WorkOrderItemLine>;
};

export type WorkOrderSummary = WorkOrder & {
  customer: Customer | undefined;
};

export type CreateCustomerInput = {
  organizationId: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
};

export type AddCustomerResult = typeof AddCustomerResponseSchema.Type["data"];

export type CreateWorkOrderInput = {
  customerId: string;
  workOrder: {
    organizationId: string;
    number: string;
    title: string;
    description: string;
    status: string;
  };
};

export type AddWorkOrderToCustomerResult =
  typeof AddWorkOrderToCustomerResponseSchema.Type["data"];

export type AddWorkOrderItemInput = {
  workOrderId: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type RemoveWorkOrderItemInput = {
  workOrderId: string;
  workOrderItemId: string;
  quantity: number;
};

export type SetWorkOrderItemQuantityInput = {
  workOrderId: string;
  workOrderItemId: string;
  quantity: number;
};

export type SetWorkOrderStatusInput = {
  workOrderId: string;
  status: string;
};

class ApiError extends Data.TaggedError("ApiError")<{
  message: string;
  status?: number;
}> {}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const getAuthHeaders = (): Record<string, string> => {
  const session = getStoredSession();

  if (session === undefined) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.token}`
  };
};

const getBodyMessage = (body: unknown): string | undefined => {
  if (typeof body !== "object" || body === null || !("message" in body)) {
    return undefined;
  }

  const message = body.message;
  return typeof message === "string" ? message : undefined;
};

const requestJson = (path: string, init: RequestInit = {}) =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`${apiBaseUrl}${path}`, {
          ...init,
          headers: {
            ...getAuthHeaders(),
            ...init.headers
          }
        }),
      catch: (error) =>
        new ApiError({
          message: error instanceof Error ? error.message : "Unable to reach API"
        })
    });

    const body = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (error) =>
        new ApiError({
          message: error instanceof Error ? error.message : "Unable to parse API response",
          status: response.status
        })
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new ApiError({
          message: getBodyMessage(body) ?? "API request failed",
          status: response.status
        })
      );
    }

    return body;
  });

export const getOrganizations = () =>
  requestJson("/usecase/me/organizations").pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationsResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getCustomers = () =>
  requestJson("/customers/").pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getCustomer = (customerId: string) =>
  requestJson(`/customers/${customerId}`).pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomerResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getOrganizationCustomers = () =>
  requestJson("/organization-customers/").pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationCustomersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getWorkOrders = () =>
  requestJson("/work-orders/").pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrdersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getWorkOrder = (workOrderId: string) =>
  requestJson(`/work-orders/${workOrderId}`).pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrderResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getItems = () =>
  requestJson("/items/").pipe(
    Effect.flatMap(Schema.decodeUnknown(ItemsResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getWorkOrderItems = () =>
  requestJson("/work-order-items/").pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrderItemsResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getWorkOrdersForOrganization = (organizationId: string) =>
  Effect.all({
    customers: getCustomers(),
    workOrders: getWorkOrders()
  }).pipe(
    Effect.map(({ customers, workOrders }) => {
      const customerById = new Map(customers.map((customer) => [customer.id, customer]));

      return workOrders
        .filter(
          (workOrder) =>
            organizationId === "" || workOrder.organizationId === organizationId
        )
        .map((workOrder) => ({
          ...workOrder,
          customer: customerById.get(workOrder.customerId)
        }))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    })
  );

export const getCustomersForOrganization = (organizationId: string) => {
  if (organizationId === "") {
    return Effect.succeed([] as ReadonlyArray<CustomerSummary>);
  }

  return Effect.all({
    customers: getCustomers(),
    organizationCustomers: getOrganizationCustomers()
  }).pipe(
    Effect.map(({ customers, organizationCustomers }) => {
      const organizationCustomerByCustomerId = new Map(
        organizationCustomers
          .filter((item) => item.organizationId === organizationId)
          .map((item) => [item.customerId, item])
      );

      return customers
        .filter((customer) => organizationCustomerByCustomerId.has(customer.id))
        .map((customer) => ({
          ...customer,
          organizationCustomerId: organizationCustomerByCustomerId.get(customer.id)!.id
        }));
    })
  );
};

export const getCustomerDetails = (customerId: string, organizationId: string) =>
  Effect.all({
    customer: getCustomer(customerId),
    organizationCustomers: getOrganizationCustomers(),
    workOrders: getWorkOrders()
  }).pipe(
    Effect.flatMap(({ customer, organizationCustomers, workOrders }) => {
      const hasOrganizationCustomer =
        organizationId === "" ||
        organizationCustomers.some(
          (item) => item.organizationId === organizationId && item.customerId === customerId
        );

      if (!hasOrganizationCustomer) {
        return Effect.fail(
          new ApiError({
            message: "Customer is not assigned to the selected organization",
            status: 404
          })
        );
      }

      return Effect.succeed({
        customer,
        workOrders: workOrders.filter(
          (workOrder) =>
            workOrder.customerId === customerId &&
            (organizationId === "" || workOrder.organizationId === organizationId)
        )
      });
    })
  );

export const getWorkOrderDetails = (workOrderId: string, organizationId: string) =>
  Effect.all({
    workOrder: getWorkOrder(workOrderId),
    customers: getCustomers(),
    items: getItems(),
    workOrderItems: getWorkOrderItems()
  }).pipe(
    Effect.flatMap(({ workOrder, customers, items, workOrderItems }) => {
      if (organizationId !== "" && workOrder.organizationId !== organizationId) {
        return Effect.fail(
          new ApiError({
            message: "Work order is not assigned to the selected organization",
            status: 404
          })
        );
      }

      const customer = customers.find((item) => item.id === workOrder.customerId);

      if (customer === undefined) {
        return Effect.fail(
          new ApiError({
            message: "Work order customer was not found",
            status: 404
          })
        );
      }

      const itemById = new Map(items.map((item) => [item.id, item]));

      return Effect.succeed({
        workOrder,
        customer,
        items: items.filter((item) => item.isActive),
        workOrderItems: workOrderItems
          .filter((workOrderItem) => workOrderItem.workOrderId === workOrderId)
          .map((workOrderItem) => ({
            ...workOrderItem,
            item: itemById.get(workOrderItem.itemId)
          }))
      });
    })
  );

export const addCustomer = (input: CreateCustomerInput) =>
  requestJson("/usecases/add-customer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(AddCustomerResponseSchema)),
    Effect.map((response) => response.data)
  );

export const addWorkOrderToCustomer = (input: CreateWorkOrderInput) =>
  requestJson("/usecases/add-work-order-to-customer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(AddWorkOrderToCustomerResponseSchema)),
    Effect.map((response) => response.data)
  );

export const addWorkOrderItem = (input: AddWorkOrderItemInput) =>
  requestJson(`/usecase/work-order/${input.workOrderId}/add-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      itemId: input.itemId,
      description: input.description,
      quantity: input.quantity,
      unitPriceCents: input.unitPriceCents
    })
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(AddWorkOrderItemResponseSchema)),
    Effect.map((response) => response.data)
  );

export const removeWorkOrderItem = (input: RemoveWorkOrderItemInput) =>
  requestJson(`/usecase/work-order/${input.workOrderId}/remove-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      workOrderItemId: input.workOrderItemId,
      quantity: input.quantity
    })
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(RemoveWorkOrderItemResponseSchema)),
    Effect.map((response) => response.data)
  );

export const setWorkOrderItemQuantity = (input: SetWorkOrderItemQuantityInput) =>
  requestJson(`/usecase/work-order/${input.workOrderId}/set-item-quantity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      workOrderItemId: input.workOrderItemId,
      quantity: input.quantity
    })
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(SetWorkOrderItemQuantityResponseSchema)),
    Effect.map((response) => response.data)
  );

export const setWorkOrderStatus = (input: SetWorkOrderStatusInput) =>
  requestJson(`/usecase/work-order/${input.workOrderId}/set-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      status: input.status
    })
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(SetWorkOrderStatusResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getDashboardStats = Effect.all({
  orders: getWorkOrders().pipe(Effect.map((items) => items.length)),
  activeOrders: getWorkOrders().pipe(
    Effect.map((items) =>
      items.filter((item) => item.status !== "completed" && item.status !== "cancelled").length
    )
  )
});
