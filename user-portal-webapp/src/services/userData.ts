import { Data, Effect, Schema } from "effect";
import { getStoredSession } from "./auth";

export type Order = {
  id: string;
  number: string;
  status: "processing" | "shipped" | "delivered";
  total: number;
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: "open" | "waiting" | "resolved";
  updatedAt: string;
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

export type CreateCustomerInput = {
  organizationId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export type AddCustomerResult = typeof AddCustomerResponseSchema.Type["data"];

class ApiError extends Data.TaggedError("ApiError")<{
  message: string;
  status?: number;
}> {}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const orders: Order[] = [
  { id: "ord-001", number: "SO-1042", status: "processing", total: 1280 },
  { id: "ord-002", number: "SO-1041", status: "shipped", total: 640 },
  { id: "ord-003", number: "SO-1038", status: "delivered", total: 2140 }
];

const tickets: SupportTicket[] = [
  { id: "tkt-001", subject: "Invoice copy request", status: "open", updatedAt: "2026-06-03" },
  { id: "tkt-002", subject: "Delivery address update", status: "waiting", updatedAt: "2026-06-02" },
  { id: "tkt-003", subject: "Warranty confirmation", status: "resolved", updatedAt: "2026-05-29" }
];

export const getOrders = Effect.succeed(orders);

export const getSupportTickets = Effect.succeed(tickets);

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
  requestJson("/organizations/").pipe(
    Effect.flatMap(Schema.decodeUnknown(OrganizationsResponseSchema)),
    Effect.map((response) => response.data)
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

export const getDashboardStats = Effect.all({
  orders: getOrders.pipe(Effect.map((items) => items.length)),
  activeOrders: getOrders.pipe(
    Effect.map((items) => items.filter((item) => item.status !== "delivered").length)
  ),
  tickets: getSupportTickets.pipe(Effect.map((items) => items.length)),
  openTickets: getSupportTickets.pipe(
    Effect.map((items) => items.filter((item) => item.status !== "resolved").length)
  )
});
