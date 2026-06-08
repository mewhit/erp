import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import {
  CreateWorkOrderItemInput,
  UpdateWorkOrderItemInput
} from "./work-order-item.model.js"
import { WorkOrderItemService } from "./work-order-item.service.js"

const WorkOrderItemPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `WorkOrderItem ${id} not found`
    },
    {
      status: 404
    }
  )

export const workOrderItemRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const workOrderItems = yield* Effect.promise(() =>
        WorkOrderItemService.findAll()
      )

      return yield* HttpServerResponse.json({
        data: workOrderItems
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(WorkOrderItemPathParams)
      const workOrderItem = yield* Effect.promise(() =>
        WorkOrderItemService.findById(id)
      )

      if (workOrderItem === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: workOrderItem
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateWorkOrderItemInput
      )
      const workOrderItem = yield* Effect.promise(() =>
        WorkOrderItemService.create(input)
      )

      return yield* HttpServerResponse.json(
        {
          data: workOrderItem
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
      const { id } = yield* HttpRouter.schemaPathParams(WorkOrderItemPathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(
        UpdateWorkOrderItemInput
      )
      const workOrderItem = yield* Effect.promise(() =>
        WorkOrderItemService.updateById(id, input)
      )

      if (workOrderItem === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: workOrderItem
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(WorkOrderItemPathParams)
      const deleted = yield* Effect.promise(() =>
        WorkOrderItemService.deleteById(id)
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
