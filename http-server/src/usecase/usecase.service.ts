import { Data, Effect, Schema } from "effect"
import { Customer } from "../customer/customer.model.js"
import { CustomerWorkOrder } from "../customer-work-order/customer-work-order.model.js"
import { OrganizationCustomer } from "../organization-customer/organization-customer.model.js"
import { createApiClient } from "../shared/api-client/index.js"
import { WorkOrder } from "../work-order/work-order.model.js"
import {
  AddCustomerResult,
  type AddCustomerInput,
  AddUserOrganizationUserRole,
  AddUserUser,
  AddWorkOrderToCustomerResult,
  type AddWorkOrderToCustomerInput,
  type AddUserInput,
  type AddUserResult
} from "./usecase.model.js"

class UseCaseError extends Data.TaggedError("UseCaseError")<{
  phase:
    | "create-customer"
    | "assign-organization-customer"
    | "create-work-order"
    | "assign-customer-work-order"
    | "create-user"
    | "assign-organization-role"
    | "parse-response"
  message: string
  status?: number
}> {}

const UserResponse = Schema.Struct({
  data: AddUserUser
})

const OrganizationUserRoleResponse = Schema.Struct({
  data: AddUserOrganizationUserRole
})

const CustomerResponse = Schema.Struct({
  data: Customer
})

const OrganizationCustomerResponse = Schema.Struct({
  data: OrganizationCustomer
})

const WorkOrderResponse = Schema.Struct({
  data: WorkOrder
})

const CustomerWorkOrderResponse = Schema.Struct({
  data: CustomerWorkOrder
})

const AddCustomerResultResponse = Schema.Struct({
  data: AddCustomerResult
})

const AddWorkOrderToCustomerResultResponse = Schema.Struct({
  data: AddWorkOrderToCustomerResult
})

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unexpected usecase failure"

const usecaseApiClient = createApiClient({
  baseUrl: process.env.USECASE_API_BASE_URL
})

const mapApiClientError = (
  phase:
    | "create-customer"
    | "assign-organization-customer"
    | "create-work-order"
    | "assign-customer-work-order"
    | "create-user"
    | "assign-organization-role",
  error: { message: string; status?: number }
) =>
  new UseCaseError({
    phase,
    message: error.message,
    status: error.status
  })

export const UsecaseService = {
  addWorkOrderToCustomer: (
    input: AddWorkOrderToCustomerInput
  ): Effect.Effect<AddWorkOrderToCustomerResult, UseCaseError> =>
    Effect.gen(function* () {
      const workOrderResponse = yield* usecaseApiClient.workOrder
        .post({
          ...input.workOrder,
          customerId: input.customerId
        })
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("create-work-order", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(WorkOrderResponse)(body).pipe(
              Effect.mapError(
                (error) =>
                  new UseCaseError({
                    phase: "parse-response",
                    message: getErrorMessage(error)
                  })
              )
            )
          )
        )

      const customerWorkOrderResponse =
        yield* usecaseApiClient.customerWorkOrder
          .post({
            customerId: input.customerId,
            workOrderId: workOrderResponse.data.id
          })
          .pipe(
            Effect.mapError((error) =>
              mapApiClientError("assign-customer-work-order", error)
            ),
            Effect.flatMap((body) =>
              Schema.decodeUnknown(CustomerWorkOrderResponse)(body).pipe(
                Effect.mapError(
                  (error) =>
                    new UseCaseError({
                      phase: "parse-response",
                      message: getErrorMessage(error)
                    })
                )
              )
            )
          )

      return yield* Schema.decodeUnknown(AddWorkOrderToCustomerResultResponse)({
        data: {
          workOrder: workOrderResponse.data,
          customerWorkOrder: customerWorkOrderResponse.data
        }
      }).pipe(
        Effect.map((response) => response.data),
        Effect.mapError(
          (error) =>
            new UseCaseError({
              phase: "parse-response",
              message: getErrorMessage(error)
            })
        )
      )
    }),

  addCustomer: (
    input: AddCustomerInput
  ): Effect.Effect<AddCustomerResult, UseCaseError> =>
    Effect.gen(function* () {
      const customerResponse = yield* usecaseApiClient.customer
        .post(input.customer)
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("create-customer", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(CustomerResponse)(body).pipe(
              Effect.mapError(
                (error) =>
                  new UseCaseError({
                    phase: "parse-response",
                    message: getErrorMessage(error)
                  })
              )
            )
          )
        )

      const organizationCustomerResponse =
        yield* usecaseApiClient.organizationCustomer
          .post({
            organizationId: input.organizationId,
            customerId: customerResponse.data.id
          })
          .pipe(
            Effect.mapError((error) =>
              mapApiClientError("assign-organization-customer", error)
            ),
            Effect.flatMap((body) =>
              Schema.decodeUnknown(OrganizationCustomerResponse)(body).pipe(
                Effect.mapError(
                  (error) =>
                    new UseCaseError({
                      phase: "parse-response",
                      message: getErrorMessage(error)
                    })
                )
              )
            )
          )

      return yield* Schema.decodeUnknown(AddCustomerResultResponse)({
        data: {
          customer: customerResponse.data,
          organizationCustomer: organizationCustomerResponse.data
        }
      }).pipe(
        Effect.map((response) => response.data),
        Effect.mapError(
          (error) =>
            new UseCaseError({
              phase: "parse-response",
              message: getErrorMessage(error)
            })
        )
      )
    }),

  addUser: (input: AddUserInput): Effect.Effect<AddUserResult, UseCaseError> =>
    Effect.gen(function* () {
      const userResponse = yield* usecaseApiClient.user.post(input.user).pipe(
        Effect.mapError((error) => mapApiClientError("create-user", error)),
        Effect.flatMap((body) =>
          Schema.decodeUnknown(UserResponse)(body).pipe(
            Effect.mapError(
              (error) =>
                new UseCaseError({
                  phase: "parse-response",
                  message: getErrorMessage(error)
                })
            )
          )
        )
      )

      const organizationUserRoleResponse = yield* usecaseApiClient.organizationUserRole
        .post({
          organizationId: input.organizationId,
          userId: userResponse.data.id,
          roleId: input.roleId
        })
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("assign-organization-role", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(OrganizationUserRoleResponse)(body).pipe(
              Effect.mapError(
                (error) =>
                  new UseCaseError({
                    phase: "parse-response",
                    message: getErrorMessage(error)
                  })
              )
            )
          )
        )

      return {
        user: userResponse.data,
        organizationUserRole: organizationUserRoleResponse.data
      }
    })
}
