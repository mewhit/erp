import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import {
  CreateWorkOrderInput,
  UpdateWorkOrderInput
} from "./work-order.model.js"
import { WorkOrderService } from "./work-order.service.js"

const WorkOrderPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `WorkOrder ${id} not found`
    },
    {
      status: 404
    }
  )

export const workOrderRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const workOrders = yield* Effect.promise(() => WorkOrderService.findAll())

      return yield* HttpServerResponse.json({
        data: workOrders
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(WorkOrderPathParams)
      const workOrder = yield* Effect.promise(() => WorkOrderService.findById(id))

      if (workOrder === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: workOrder
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateWorkOrderInput
      )
      const workOrder = yield* Effect.promise(() => WorkOrderService.create(input))

      return yield* HttpServerResponse.json(
        {
          data: workOrder
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
      const { id } = yield* HttpRouter.schemaPathParams(WorkOrderPathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(
        UpdateWorkOrderInput
      )
      const workOrder = yield* Effect.promise(() =>
        WorkOrderService.updateById(id, input)
      )

      if (workOrder === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: workOrder
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(WorkOrderPathParams)
      const deleted = yield* Effect.promise(() => WorkOrderService.deleteById(id))

      if (!deleted) {
        return yield* notFound(id)
      }

      return HttpServerResponse.empty({
        status: 204
      })
    })
  )
)
