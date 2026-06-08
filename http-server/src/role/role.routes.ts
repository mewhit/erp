import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import { CreateRoleInput, UpdateRoleInput } from "./role.model.js"
import { RoleService } from "./role.service.js"

const RolePathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `Role ${id} not found`
    },
    {
      status: 404
    }
  )

export const roleRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const roles = yield* Effect.promise(() => RoleService.findAll())

      return yield* HttpServerResponse.json({
        data: roles
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(RolePathParams)
      const role = yield* Effect.promise(() => RoleService.findById(id))

      if (role === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: role
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(CreateRoleInput)
      const role = yield* Effect.promise(() => RoleService.create(input))

      return yield* HttpServerResponse.json(
        {
          data: role
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
      const { id } = yield* HttpRouter.schemaPathParams(RolePathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(UpdateRoleInput)
      const role = yield* Effect.promise(() =>
        RoleService.updateById(id, input)
      )

      if (role === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: role
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(RolePathParams)
      const deleted = yield* Effect.promise(() => RoleService.deleteById(id))

      if (!deleted) {
        return yield* notFound(id)
      }

      return HttpServerResponse.empty({
        status: 204
      })
    })
  )
)
