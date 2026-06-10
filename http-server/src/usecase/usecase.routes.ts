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
  AddWorkOrderItemInput,
  AddWorkOrderToCustomerInput,
  RemoveWorkOrderItemInput,
  SetWorkOrderItemQuantityInput,
  SetWorkOrderStatusInput
} from "./usecase.model.js"
import { UsecaseService } from "./usecase.service.js"

const WorkOrderPathParams = Schema.Struct({
  workOrderId: Schema.String
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
  )
)
