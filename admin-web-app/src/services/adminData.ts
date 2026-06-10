import { Data, Effect, Schema } from "effect";
import { getStoredSession } from "./auth";

const RoleSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  code: Schema.String,
  isActive: Schema.Boolean,
  createdAt: Schema.String
});

const RolesResponseSchema = Schema.Struct({
  data: Schema.Array(RoleSchema)
});

const RoleResponseSchema = Schema.Struct({
  data: RoleSchema
});

export type Role = typeof RoleSchema.Type;

export type CreateRoleInput = {
  name: string;
  code: string;
};

const UserSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.String
});

const UsersResponseSchema = Schema.Struct({
  data: Schema.Array(UserSchema)
});

export type User = typeof UserSchema.Type;

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

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

const ItemResponseSchema = Schema.Struct({
  data: ItemSchema
});

export type Item = typeof ItemSchema.Type;

export type CreateItemInput = {
  name: string;
  sku: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
};

export type UpdateItemInput = CreateItemInput & {
  isActive: boolean;
};

const CustomerSchema = Schema.Struct({
  id: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  email: Schema.String,
  phone: Schema.String,
  isActive: Schema.Boolean,
  createdAt: Schema.String
});

const CustomersResponseSchema = Schema.Struct({
  data: Schema.Array(CustomerSchema)
});

const CustomerResponseSchema = Schema.Struct({
  data: CustomerSchema
});

export type Customer = typeof CustomerSchema.Type;

export type CreateCustomerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type UpdateCustomerInput = CreateCustomerInput & {
  isActive: boolean;
};

const OrganizationSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  code: Schema.String,
  createdAt: Schema.String
});

const OrganizationsResponseSchema = Schema.Struct({
  data: Schema.Array(OrganizationSchema)
});

const OrganizationResponseSchema = Schema.Struct({
  data: OrganizationSchema
});

export type Organization = typeof OrganizationSchema.Type;

export type OrganizationOption = Organization;

export type CreateOrganizationInput = {
  name: string;
  code: string;
};

const OrganizationUserRoleSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String,
  createdAt: Schema.String
});

const OrganizationUserRolesResponseSchema = Schema.Struct({
  data: Schema.Array(OrganizationUserRoleSchema)
});

const OrganizationUserRoleResponseSchema = Schema.Struct({
  data: OrganizationUserRoleSchema
});

const AddUserResultSchema = Schema.Struct({
  user: UserSchema,
  organizationUserRole: OrganizationUserRoleSchema
});

const AddUserResponseSchema = Schema.Struct({
  data: AddUserResultSchema
});

export type OrganizationUserRole = typeof OrganizationUserRoleSchema.Type;

export type CreateOrganizationUserRoleInput = {
  organizationId: string;
  userId: string;
  roleId: string;
};

export type AddUserToOrganizationInput = {
  user: CreateUserInput;
  organizationId: string;
  roleId: string;
};

const OrganizationCustomerSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  customerId: Schema.String,
  createdAt: Schema.String
});

const OrganizationCustomersResponseSchema = Schema.Struct({
  data: Schema.Array(OrganizationCustomerSchema)
});

const OrganizationCustomerResponseSchema = Schema.Struct({
  data: OrganizationCustomerSchema
});

export type OrganizationCustomer = typeof OrganizationCustomerSchema.Type;

export type CreateOrganizationCustomerInput = {
  organizationId: string;
  customerId: string;
};

export type UpdateOrganizationCustomerInput = CreateOrganizationCustomerInput;

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

export type WorkOrder = typeof WorkOrderSchema.Type;

export type CreateWorkOrderInput = {
  organizationId: string;
  customerId: string;
  number: string;
  title: string;
  description: string;
  status: string;
};

export type UpdateWorkOrderInput = CreateWorkOrderInput;

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

const WorkOrderItemResponseSchema = Schema.Struct({
  data: WorkOrderItemSchema
});

export type WorkOrderItem = typeof WorkOrderItemSchema.Type;

export type CreateWorkOrderItemInput = {
  workOrderId: string;
  itemId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type UpdateWorkOrderItemInput = CreateWorkOrderItemInput;

const CustomerWorkOrderSchema = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  workOrderId: Schema.String,
  createdAt: Schema.String
});

const CustomerWorkOrdersResponseSchema = Schema.Struct({
  data: Schema.Array(CustomerWorkOrderSchema)
});

const CustomerWorkOrderResponseSchema = Schema.Struct({
  data: CustomerWorkOrderSchema
});

export type CustomerWorkOrder = typeof CustomerWorkOrderSchema.Type;

export type CreateCustomerWorkOrderInput = {
  customerId: string;
  workOrderId: string;
};

export type UpdateCustomerWorkOrderInput = CreateCustomerWorkOrderInput;

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

const requestEmpty = (path: string, init: RequestInit = {}) =>
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

    if (!response.ok) {
      return yield* Effect.fail(
        new ApiError({
          message: "API request failed",
          status: response.status
        })
      );
    }
  });

export const getRoles = () =>
  requestJson("/roles/").pipe(
    Effect.flatMap(Schema.decodeUnknown(RolesResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createRole = (input: CreateRoleInput) =>
  requestJson("/roles/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(RoleResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getUsers = () =>
  requestJson("/users/").pipe(
    Effect.flatMap(Schema.decodeUnknown(UsersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getItems = () =>
  requestJson("/items/").pipe(
    Effect.flatMap(Schema.decodeUnknown(ItemsResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createItem = (input: CreateItemInput) =>
  requestJson("/items/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(ItemResponseSchema)),
    Effect.map((response) => response.data)
  );

export const updateItem = (id: string, input: UpdateItemInput) =>
  requestJson(`/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(ItemResponseSchema)),
    Effect.map((response) => response.data)
  );

export const deleteItem = (id: string) =>
  requestEmpty(`/items/${id}`, {
    method: "DELETE"
  });

export const getCustomers = () =>
  requestJson("/customers/").pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createCustomer = (input: CreateCustomerInput) =>
  requestJson("/customers/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomerResponseSchema)),
    Effect.map((response) => response.data)
  );

export const updateCustomer = (id: string, input: UpdateCustomerInput) =>
  requestJson(`/customers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomerResponseSchema)),
    Effect.map((response) => response.data)
  );

export const deleteCustomer = (id: string) =>
  requestEmpty(`/customers/${id}`, {
    method: "DELETE"
  });

export const getOrganizations = () =>
  requestJson("/organizations/").pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationsResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getOrganization = (id: string) =>
  requestJson(`/organizations/${id}`).pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createOrganization = (input: CreateOrganizationInput) =>
  requestJson("/organizations/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getOrganizationOptions = getOrganizations;

export const getOrganizationUserRoles = () =>
  requestJson("/organization-user-roles/").pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationUserRolesResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createOrganizationUserRole = (
  input: CreateOrganizationUserRoleInput
) =>
  requestJson("/organization-user-roles/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationUserRoleResponseSchema)),
    Effect.map((response) => response.data)
  );

export const deleteOrganizationUserRole = (id: string) =>
  requestEmpty(`/organization-user-roles/${id}`, {
    method: "DELETE"
  });

export const addUserToOrganization = (input: AddUserToOrganizationInput) =>
  requestJson("/usecases/add-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(AddUserResponseSchema)),
    Effect.map((response) => response.data)
  );

export const getOrganizationCustomers = () =>
  requestJson("/organization-customers/").pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationCustomersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createOrganizationCustomer = (
  input: CreateOrganizationCustomerInput
) =>
  requestJson("/organization-customers/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationCustomerResponseSchema)),
    Effect.map((response) => response.data)
  );

export const updateOrganizationCustomer = (
  id: string,
  input: UpdateOrganizationCustomerInput
) =>
  requestJson(`/organization-customers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationCustomerResponseSchema)),
    Effect.map((response) => response.data)
  );

export const deleteOrganizationCustomer = (id: string) =>
  requestEmpty(`/organization-customers/${id}`, {
    method: "DELETE"
  });

export const getWorkOrders = () =>
  requestJson("/work-orders/").pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrdersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createWorkOrder = (input: CreateWorkOrderInput) =>
  requestJson("/work-orders/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrderResponseSchema)),
    Effect.map((response) => response.data)
  );

export const updateWorkOrder = (id: string, input: UpdateWorkOrderInput) =>
  requestJson(`/work-orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrderResponseSchema)),
    Effect.map((response) => response.data)
  );

export const deleteWorkOrder = (id: string) =>
  requestEmpty(`/work-orders/${id}`, {
    method: "DELETE"
  });

export const getWorkOrderItems = () =>
  requestJson("/work-order-items/").pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrderItemsResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createWorkOrderItem = (input: CreateWorkOrderItemInput) =>
  requestJson("/work-order-items/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrderItemResponseSchema)),
    Effect.map((response) => response.data)
  );

export const updateWorkOrderItem = (
  id: string,
  input: UpdateWorkOrderItemInput
) =>
  requestJson(`/work-order-items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(WorkOrderItemResponseSchema)),
    Effect.map((response) => response.data)
  );

export const deleteWorkOrderItem = (id: string) =>
  requestEmpty(`/work-order-items/${id}`, {
    method: "DELETE"
  });

export const getCustomerWorkOrders = () =>
  requestJson("/customer-work-orders/").pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomerWorkOrdersResponseSchema)),
    Effect.map((response) => response.data)
  );

export const createCustomerWorkOrder = (
  input: CreateCustomerWorkOrderInput
) =>
  requestJson("/customer-work-orders/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomerWorkOrderResponseSchema)),
    Effect.map((response) => response.data)
  );

export const updateCustomerWorkOrder = (
  id: string,
  input: UpdateCustomerWorkOrderInput
) =>
  requestJson(`/customer-work-orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  }).pipe(
    Effect.flatMap(Schema.decodeUnknown(CustomerWorkOrderResponseSchema)),
    Effect.map((response) => response.data)
  );

export const deleteCustomerWorkOrder = (id: string) =>
  requestEmpty(`/customer-work-orders/${id}`, {
    method: "DELETE"
  });

export const getDashboardStats = Effect.all({
  organizations: getOrganizations().pipe(Effect.map((items) => items.length)),
  activeOrganizations: getOrganizations().pipe(Effect.map((items) => items.length)),
  users: getUsers().pipe(Effect.map((items) => items.length)),
  seats: Effect.succeed(0)
});
