import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import { CreateUserInput } from "./user.model.js"
import { UserService } from "./user.service.js"

const UserPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `User ${id} not found`
    },
    {
      status: 404
    }
  )

export const userRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const users = yield* Effect.promise(() => UserService.findAll())

      return yield* HttpServerResponse.json({
        data: users
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(UserPathParams)
      const user = yield* Effect.promise(() => UserService.findById(id))

      if (user === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: user
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(CreateUserInput)
      const user = yield* Effect.promise(() => UserService.create(input))

      return yield* HttpServerResponse.json(
        {
          data: user
        },
        {
          status: 201
        }
      )
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(UserPathParams)
      const deleted = yield* Effect.promise(() => UserService.deleteById(id))

      if (!deleted) {
        return yield* notFound(id)
      }

      return HttpServerResponse.empty({
        status: 204
      })
    })
  )
)
