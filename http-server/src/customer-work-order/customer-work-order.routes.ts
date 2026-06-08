import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import {
  CreateCustomerWorkOrderInput,
  UpdateCustomerWorkOrderInput
} from "./customer-work-order.model.js"
import { CustomerWorkOrderService } from "./customer-work-order.service.js"

const CustomerWorkOrderPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `CustomerWorkOrder ${id} not found`
    },
    {
      status: 404
    }
  )

export const customerWorkOrderRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const customerWorkOrders = yield* Effect.promise(() =>
        CustomerWorkOrderService.findAll()
      )

      return yield* HttpServerResponse.json({
        data: customerWorkOrders
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(
        CustomerWorkOrderPathParams
      )
      const customerWorkOrder = yield* Effect.promise(() =>
        CustomerWorkOrderService.findById(id)
      )

      if (customerWorkOrder === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: customerWorkOrder
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateCustomerWorkOrderInput
      )
      const customerWorkOrder = yield* Effect.promise(() =>
        CustomerWorkOrderService.create(input)
      )

      return yield* HttpServerResponse.json(
        {
          data: customerWorkOrder
        },
        {
          status: 201
        }
      )
    })
  ),

  HttpRouter.put(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(
        CustomerWorkOrderPathParams
      )
      const input = yield* HttpServerRequest.schemaBodyJson(
        UpdateCustomerWorkOrderInput
      )
      const customerWorkOrder = yield* Effect.promise(() =>
        CustomerWorkOrderService.updateById(id, input)
      )

      if (customerWorkOrder === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: customerWorkOrder
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(
        CustomerWorkOrderPathParams
      )
      const deleted = yield* Effect.promise(() =>
        CustomerWorkOrderService.deleteById(id)
      )

      if (!deleted) {
        return yield* notFound(id)
      }

      return HttpServerResponse.empty({
        status: 204
      })
    })
  )
)
