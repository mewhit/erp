import { Data, Effect, Schema } from "effect"
import { Customer } from "../customer/customer.model.js"
import { CustomerWorkOrder } from "../customer-work-order/customer-work-order.model.js"
import { Item } from "../item/item.model.js"
import { Organization } from "../organization/organization.model.js"
import { OrganizationCustomer } from "../organization-customer/organization-customer.model.js"
import { createApiClient } from "../shared/api-client/index.js"
import { WorkOrderItem } from "../work-order-item/work-order-item.model.js"
import { WorkOrder } from "../work-order/work-order.model.js"
import {
  AddCustomerResult,
  type AddCustomerInput,
  type AddWorkOrderItemInput,
  type AddWorkOrderItemResult,
  type RemoveWorkOrderItemInput,
  type RemoveWorkOrderItemResult,
  type SetWorkOrderItemQuantityInput,
  type SetWorkOrderItemQuantityResult,
  type SetWorkOrderStatusInput,
  type SetWorkOrderStatusResult,
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
    | "fetch-organization-user-roles"
    | "fetch-organization"
    | "fetch-work-order"
    | "update-work-order"
    | "fetch-item"
    | "fetch-items"
    | "fetch-work-order-items"
    | "fetch-work-order-item"
    | "validate-work-order-item"
    | "create-work-order-item"
    | "update-work-order-item"
    | "delete-work-order-item"
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

const OrganizationUserRolesResponse = Schema.Struct({
  data: Schema.Array(AddUserOrganizationUserRole)
})

const OrganizationResponse = Schema.Struct({
  data: Organization
})

const CustomerResponse = Schema.Struct({
  data: Customer
})

const ItemResponse = Schema.Struct({
  data: Item
})

const ItemsResponse = Schema.Struct({
  data: Schema.Array(Item)
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

const WorkOrderItemResponse = Schema.Struct({
  data: WorkOrderItem
})

const WorkOrderItemsResponse = Schema.Struct({
  data: Schema.Array(WorkOrderItem)
})

const AddCustomerResultResponse = Schema.Struct({
  data: AddCustomerResult
})

const AddWorkOrderToCustomerResultResponse = Schema.Struct({
  data: AddWorkOrderToCustomerResult
})

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unexpected usecase failure"

const createUsecaseApiClient = (authorization: string | undefined) =>
  createApiClient({
    baseUrl: process.env.USECASE_API_BASE_URL,
    headers: authorization === undefined ? {} : { Authorization: authorization }
  })

const mapApiClientError = (
  phase:
    | "create-customer"
    | "assign-organization-customer"
    | "create-work-order"
    | "assign-customer-work-order"
    | "create-user"
    | "assign-organization-role"
    | "fetch-organization-user-roles"
    | "fetch-organization"
    | "fetch-work-order"
    | "update-work-order"
    | "fetch-item"
    | "fetch-items"
    | "fetch-work-order-items"
    | "fetch-work-order-item"
    | "validate-work-order-item"
    | "create-work-order-item"
    | "update-work-order-item"
    | "delete-work-order-item",
  error: { message: string; status?: number }
) =>
  new UseCaseError({
    phase,
    message: error.message,
    status: error.status
  })

export const UsecaseService = {
  findOrganizationsForUser: (
    userId: string,
    authorization: string | undefined
  ): Effect.Effect<ReadonlyArray<Organization>, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)
      const organizationUserRolesResponse =
        yield* usecaseApiClient.organizationUserRole.byUserId(userId).pipe(
          Effect.mapError((error) =>
            mapApiClientError("fetch-organization-user-roles", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(OrganizationUserRolesResponse)(body).pipe(
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

      const organizationIds = Array.from(
        new Set(
          organizationUserRolesResponse.data.map(
            (organizationUserRole) => organizationUserRole.organizationId
          )
        )
      )

      const organizationResponses = yield* Effect.all(
        organizationIds.map((organizationId) =>
          usecaseApiClient.organization.getById(organizationId).pipe(
            Effect.mapError((error) =>
              mapApiClientError("fetch-organization", error)
            ),
            Effect.flatMap((body) =>
              Schema.decodeUnknown(OrganizationResponse)(body).pipe(
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
        )
      )

      return organizationResponses
        .map((response) => response.data)
        .sort((left, right) => left.name.localeCompare(right.name))
    }),

  addWorkOrderItem: (
    workOrderId: string,
    input: AddWorkOrderItemInput,
    authorization: string | undefined
  ): Effect.Effect<AddWorkOrderItemResult, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)

      const itemResponse = yield* usecaseApiClient.item
        .getById(input.itemId)
        .pipe(
          Effect.mapError((error) => mapApiClientError("fetch-item", error)),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(ItemResponse)(body).pipe(
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

      const itemsResponse = yield* usecaseApiClient.item.get().pipe(
        Effect.mapError((error) => mapApiClientError("fetch-items", error)),
        Effect.flatMap((body) =>
          Schema.decodeUnknown(ItemsResponse)(body).pipe(
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

      const workOrderItemsResponse =
        yield* usecaseApiClient.workOrderItem.get().pipe(
          Effect.mapError((error) =>
            mapApiClientError("fetch-work-order-items", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(WorkOrderItemsResponse)(body).pipe(
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

      const itemById = new Map(
        itemsResponse.data.map((item) => [item.id, item])
      )
      const matchingWorkOrderItem = workOrderItemsResponse.data.find(
        (workOrderItem) =>
          workOrderItem.workOrderId === workOrderId &&
          itemById.get(workOrderItem.itemId)?.sku === itemResponse.data.sku
      )

      if (matchingWorkOrderItem === undefined) {
        const createdWorkOrderItem = yield* usecaseApiClient.workOrderItem
          .post({
            workOrderId,
            itemId: input.itemId,
            description: input.description,
            quantity: input.quantity,
            unitPriceCents: input.unitPriceCents
          })
          .pipe(
            Effect.mapError((error) =>
              mapApiClientError("create-work-order-item", error)
            ),
            Effect.flatMap((body) =>
              Schema.decodeUnknown(WorkOrderItemResponse)(body).pipe(
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

        return createdWorkOrderItem.data
      }

      const updatedWorkOrderItem = yield* usecaseApiClient.workOrderItem
        .put(matchingWorkOrderItem.id, {
          workOrderId: matchingWorkOrderItem.workOrderId,
          itemId: matchingWorkOrderItem.itemId,
          description: matchingWorkOrderItem.description,
          quantity: matchingWorkOrderItem.quantity + input.quantity,
          unitPriceCents: matchingWorkOrderItem.unitPriceCents
        })
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("update-work-order-item", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(WorkOrderItemResponse)(body).pipe(
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

      return updatedWorkOrderItem.data
    }),

  removeWorkOrderItem: (
    workOrderId: string,
    input: RemoveWorkOrderItemInput,
    authorization: string | undefined
  ): Effect.Effect<RemoveWorkOrderItemResult, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)

      const workOrderItemResponse = yield* usecaseApiClient.workOrderItem
        .getById(input.workOrderItemId)
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("fetch-work-order-item", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(WorkOrderItemResponse)(body).pipe(
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

      if (workOrderItemResponse.data.workOrderId !== workOrderId) {
        return yield* Effect.fail(
          new UseCaseError({
            phase: "validate-work-order-item",
            message: "Work order item does not belong to this work order",
            status: 404
          })
        )
      }

      const remainingQuantity =
        workOrderItemResponse.data.quantity - input.quantity

      if (remainingQuantity <= 0) {
        yield* usecaseApiClient.workOrderItem.del(input.workOrderItemId).pipe(
          Effect.mapError((error) =>
            mapApiClientError("delete-work-order-item", error)
          )
        )

        return {
          workOrderItemId: input.workOrderItemId,
          removed: true,
          remainingQuantity: 0
        }
      }

      yield* usecaseApiClient.workOrderItem
        .put(input.workOrderItemId, {
          workOrderId: workOrderItemResponse.data.workOrderId,
          itemId: workOrderItemResponse.data.itemId,
          description: workOrderItemResponse.data.description,
          quantity: remainingQuantity,
          unitPriceCents: workOrderItemResponse.data.unitPriceCents
        })
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("update-work-order-item", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(WorkOrderItemResponse)(body).pipe(
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
        workOrderItemId: input.workOrderItemId,
        removed: false,
        remainingQuantity
      }
    }),

  setWorkOrderItemQuantity: (
    workOrderId: string,
    input: SetWorkOrderItemQuantityInput,
    authorization: string | undefined
  ): Effect.Effect<SetWorkOrderItemQuantityResult, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)

      const workOrderItemResponse = yield* usecaseApiClient.workOrderItem
        .getById(input.workOrderItemId)
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("fetch-work-order-item", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(WorkOrderItemResponse)(body).pipe(
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

      if (workOrderItemResponse.data.workOrderId !== workOrderId) {
        return yield* Effect.fail(
          new UseCaseError({
            phase: "validate-work-order-item",
            message: "Work order item does not belong to this work order",
            status: 404
          })
        )
      }

      if (input.quantity <= 0) {
        yield* usecaseApiClient.workOrderItem.del(input.workOrderItemId).pipe(
          Effect.mapError((error) =>
            mapApiClientError("delete-work-order-item", error)
          )
        )

        return {
          workOrderItemId: input.workOrderItemId,
          removed: true,
          quantity: 0
        }
      }

      yield* usecaseApiClient.workOrderItem
        .put(input.workOrderItemId, {
          workOrderId: workOrderItemResponse.data.workOrderId,
          itemId: workOrderItemResponse.data.itemId,
          description: workOrderItemResponse.data.description,
          quantity: input.quantity,
          unitPriceCents: workOrderItemResponse.data.unitPriceCents
        })
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("update-work-order-item", error)
          ),
          Effect.flatMap((body) =>
            Schema.decodeUnknown(WorkOrderItemResponse)(body).pipe(
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
        workOrderItemId: input.workOrderItemId,
        removed: false,
        quantity: input.quantity
      }
    }),

  setWorkOrderStatus: (
    workOrderId: string,
    input: SetWorkOrderStatusInput,
    authorization: string | undefined
  ): Effect.Effect<SetWorkOrderStatusResult, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)

      const workOrderResponse = yield* usecaseApiClient.workOrder
        .getById(workOrderId)
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("fetch-work-order", error)
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

      const updatedWorkOrderResponse = yield* usecaseApiClient.workOrder
        .put(workOrderId, {
          organizationId: workOrderResponse.data.organizationId,
          customerId: workOrderResponse.data.customerId,
          number: workOrderResponse.data.number,
          title: workOrderResponse.data.title,
          description: workOrderResponse.data.description,
          status: input.status
        })
        .pipe(
          Effect.mapError((error) =>
            mapApiClientError("update-work-order", error)
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

      return updatedWorkOrderResponse.data
    }),

  addWorkOrderToCustomer: (
    input: AddWorkOrderToCustomerInput,
    authorization: string | undefined
  ): Effect.Effect<AddWorkOrderToCustomerResult, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)
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
    input: AddCustomerInput,
    authorization: string | undefined
  ): Effect.Effect<AddCustomerResult, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)
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

  addUser: (
    input: AddUserInput,
    authorization: string | undefined
  ): Effect.Effect<AddUserResult, UseCaseError> =>
    Effect.gen(function* () {
      const usecaseApiClient = createUsecaseApiClient(authorization)
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
