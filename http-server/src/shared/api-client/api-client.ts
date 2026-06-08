import { Data, Effect } from "effect"

export class ApiClientError extends Data.TaggedError("ApiClientError")<{
  message: string
  status?: number
}> {}

export type RequestJsonInput = {
  path: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: unknown
  baseUrl?: string
  headers?: Record<string, string>
}

export type ApiClientOptions = {
  baseUrl?: string
  headers?: Record<string, string>
}

const defaultApiBaseUrl =
  process.env.API_CLIENT_BASE_URL ??
  `http://127.0.0.1:${process.env.PORT ?? "3000"}`

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unexpected API client failure"

const getBodyMessage = (body: unknown): string | undefined => {
  if (typeof body !== "object" || body === null || !("message" in body)) {
    return undefined
  }

  const message = body.message
  return typeof message === "string" ? message : undefined
}

export const requestJson = ({
  path,
  method = "GET",
  body,
  baseUrl = defaultApiBaseUrl,
  headers = {}
}: RequestJsonInput): Effect.Effect<unknown, ApiClientError> =>
  Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`${baseUrl}${path}`, {
          method,
          headers: {
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
            ...headers
          },
          body: body === undefined ? undefined : JSON.stringify(body)
        }),
      catch: (error) =>
        new ApiClientError({
          message: getErrorMessage(error)
        })
    })

    const responseBody = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (error) =>
        new ApiClientError({
          message: getErrorMessage(error),
          status: response.status
        })
    })

    if (!response.ok) {
      return yield* Effect.fail(
        new ApiClientError({
          message: getBodyMessage(responseBody) ?? "API request failed",
          status: response.status
        })
      )
    }

    return responseBody
  })

export const postJson = (
  path: string,
  body: unknown,
  options: Omit<RequestJsonInput, "path" | "method" | "body"> = {}
): Effect.Effect<unknown, ApiClientError> =>
  requestJson({
    ...options,
    path,
    method: "POST",
    body
  })

const createResourceClient = (path: string, options: ApiClientOptions) => ({
  get: () =>
    requestJson({
      ...options,
      path
    }),

  post: (body: unknown) =>
    requestJson({
      ...options,
      path,
      method: "POST",
      body
    })
})

export const createApiClient = (options: ApiClientOptions = {}) => ({
  customer: createResourceClient("/customers/", options),
  customerWorkOrder: createResourceClient("/customer-work-orders/", options),
  organizationCustomer: createResourceClient(
    "/organization-customers/",
    options
  ),
  user: createResourceClient("/users/", options),
  organizationUserRole: createResourceClient(
    "/organization-user-roles/",
    options
  ),
  workOrder: createResourceClient("/work-orders/", options)
})

export const apiClient = createApiClient()
