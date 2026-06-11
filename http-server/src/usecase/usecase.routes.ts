import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import { AuthenticatedUserId } from "../auth/index.js"
import {
  AddCustomerInput,
  AddUserInput,
  AddUserUserInput,
  AddWorkOrderItemInput,
  AddWorkOrderToCustomerInput,
  RemoveWorkOrderItemInput,
  SetWorkOrderItemQuantityInput,
  SetWorkOrderStatusInput,
  UpdateUserPasswordInput
} from "./usecase.model.js"
import { UsecaseService } from "./usecase.service.js"

const WorkOrderPathParams = Schema.Struct({
  workOrderId: Schema.String
})

const OrganizationPathParams = Schema.Struct({
  organizationId: Schema.String
})

const UserPathParams = Schema.Struct({
  id: Schema.String
})

const addWorkOrderToCustomerHandler = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest
  const input = yield* HttpServerRequest.schemaBodyJson(
    AddWorkOrderToCustomerInput
  )

  return yield* UsecaseService.addWorkOrderToCustomer(
    input,
    request.headers.authorization
  ).pipe(
    Effect.matchEffect({
      onFailure: (error) =>
        HttpServerResponse.json(
          {
            message: "Unable to add work order to customer",
            phase: error.phase
          },
          {
            status: 400
          }
        ),
      onSuccess: (result) =>
        HttpServerResponse.json(
          {
            data: result
          },
          {
            status: 201
          }
        )
    })
  )
})

export const usecaseRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/me/organizations",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const userId = yield* AuthenticatedUserId
      const organizations = yield* UsecaseService.findOrganizationsForUser(
        userId,
        request.headers.authorization
      )

      return yield* HttpServerResponse.json({
        data: organizations
      })
    })
  ),

  HttpRouter.get(
    "/organizations/:organizationId/users",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const userId = yield* AuthenticatedUserId
      const { organizationId } = yield* HttpRouter.schemaPathParams(
        OrganizationPathParams
      )

      return yield* UsecaseService.findUsersForOrganization(
        userId,
        organizationId,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to load organization users",
                phase: error.phase
              },
              {
                status: error.status ?? 400
              }
            ),
          onSuccess: (users) =>
            HttpServerResponse.json({
              data: users
            })
        })
      )
    })
  ),

  HttpRouter.post("/add-work-order-to-customer", addWorkOrderToCustomerHandler),

  HttpRouter.post(
    "/work-order/:workOrderId/add-items",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { workOrderId } = yield* HttpRouter.schemaPathParams(
        WorkOrderPathParams
      )
      const input = yield* HttpServerRequest.schemaBodyJson(
        AddWorkOrderItemInput
      )

      return yield* UsecaseService.addWorkOrderItem(
        workOrderId,
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to add work order item",
                phase: error.phase
              },
              {
                status: error.status ?? 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json({
              data: result
            })
        })
      )
    })
  ),

  HttpRouter.post(
    "/work-order/:workOrderId/remove-items",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { workOrderId } = yield* HttpRouter.schemaPathParams(
        WorkOrderPathParams
      )
      const input = yield* HttpServerRequest.schemaBodyJson(
        RemoveWorkOrderItemInput
      )

      return yield* UsecaseService.removeWorkOrderItem(
        workOrderId,
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to remove work order item",
                phase: error.phase
              },
              {
                status: error.status ?? 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json({
              data: result
            })
        })
      )
    })
  ),

  HttpRouter.post(
    "/work-order/:workOrderId/set-item-quantity",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { workOrderId } = yield* HttpRouter.schemaPathParams(
        WorkOrderPathParams
      )
      const input = yield* HttpServerRequest.schemaBodyJson(
        SetWorkOrderItemQuantityInput
      )

      return yield* UsecaseService.setWorkOrderItemQuantity(
        workOrderId,
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to update work order item quantity",
                phase: error.phase
              },
              {
                status: error.status ?? 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json({
              data: result
            })
        })
      )
    })
  ),

  HttpRouter.post(
    "/work-order/:workOrderId/set-status",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { workOrderId } = yield* HttpRouter.schemaPathParams(
        WorkOrderPathParams
      )
      const input = yield* HttpServerRequest.schemaBodyJson(
        SetWorkOrderStatusInput
      )

      return yield* UsecaseService.setWorkOrderStatus(
        workOrderId,
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to update work order status",
                phase: error.phase
              },
              {
                status: error.status ?? 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json({
              data: result
            })
        })
      )
    })
  ),

  HttpRouter.post(
    "/add-customer",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const input = yield* HttpServerRequest.schemaBodyJson(AddCustomerInput)

      return yield* UsecaseService.addCustomer(
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to add customer",
                phase: error.phase
              },
              {
                status: 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json(
              {
                data: result
              },
              {
                status: 201
              }
            )
        })
      )
    })
  ),

  HttpRouter.post(
    "/add-user",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const input = yield* HttpServerRequest.schemaBodyJson(AddUserInput)

      return yield* UsecaseService.addUser(
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to add user",
                phase: error.phase
              },
              {
                status: 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json(
              {
                data: result
              },
              {
                status: 201
              }
            )
        })
      )
    })
  ),

  HttpRouter.post(
    "/users",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const input = yield* HttpServerRequest.schemaBodyJson(AddUserUserInput)

      return yield* UsecaseService.createUser(
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to create user",
                phase: error.phase
              },
              {
                status: error.status ?? 400
              }
            ),
          onSuccess: (user) =>
            HttpServerResponse.json(
              {
                data: user
              },
              {
                status: 201
              }
            )
        })
      )
    })
  ),

  HttpRouter.put(
    "/users/:id/password",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { id } = yield* HttpRouter.schemaPathParams(UserPathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(
        UpdateUserPasswordInput
      )

      return yield* UsecaseService.updateUserPassword(
        id,
        input,
        request.headers.authorization
      ).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message:
                  error.phase === "fetch-user"
                    ? `User ${id} not found`
                    : "Unable to update user password",
                phase: error.phase
              },
              {
                status: error.status ?? 400
              }
            ),
          onSuccess: (user) =>
            HttpServerResponse.json({
              data: user
            })
        })
      )
    })
  )
)
