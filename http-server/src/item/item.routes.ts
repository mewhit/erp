import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import { CreateItemInput, UpdateItemInput } from "./item.model.js"
import { ItemService } from "./item.service.js"

const ItemPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `Item ${id} not found`
    },
    {
      status: 404
    }
  )

export const itemRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const items = yield* Effect.promise(() => ItemService.findAll())

      return yield* HttpServerResponse.json({
        data: items
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(ItemPathParams)
      const item = yield* Effect.promise(() => ItemService.findById(id))

      if (item === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: item
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(CreateItemInput)
      const item = yield* Effect.promise(() => ItemService.create(input))

      return yield* HttpServerResponse.json(
        {
          data: item
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
      const { id } = yield* HttpRouter.schemaPathParams(ItemPathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(UpdateItemInput)
      const item = yield* Effect.promise(() => ItemService.updateById(id, input))

      if (item === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: item
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(ItemPathParams)
      const deleted = yield* Effect.promise(() => ItemService.deleteById(id))

      if (!deleted) {
        return yield* notFound(id)
      }

      return HttpServerResponse.empty({
        status: 204
      })
    })
  )
)
