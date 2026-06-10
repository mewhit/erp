import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import {
  CreateOrganizationUserRoleInput,
  UpdateOrganizationUserRoleInput
} from "./organization-user-role.model.js"
import { OrganizationUserRoleService } from "./organization-user-role.service.js"

const OrganizationUserRolePathParams = Schema.Struct({
  id: Schema.String
})

const OrganizationUserRoleByUserPathParams = Schema.Struct({
  userId: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `OrganizationUserRole ${id} not found`
    },
    {
      status: 404
    }
  )

export const organizationUserRoleRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const organizationUserRoles = yield* Effect.promise(() =>
        OrganizationUserRoleService.findAll()
      )

      return yield* HttpServerResponse.json({
        data: organizationUserRoles
      })
    })
  ),

  HttpRouter.get(
    "/by-user/:userId",
    Effect.gen(function* () {
      const { userId } = yield* HttpRouter.schemaPathParams(
        OrganizationUserRoleByUserPathParams
      )
      const organizationUserRoles = yield* Effect.promise(() =>
        OrganizationUserRoleService.findByUserId(userId)
      )

      return yield* HttpServerResponse.json({
        data: organizationUserRoles
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(
        OrganizationUserRolePathParams
      )
      const organizationUserRole = yield* Effect.promise(() =>
        OrganizationUserRoleService.findById(id)
      )

      if (organizationUserRole === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: organizationUserRole
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateOrganizationUserRoleInput
      )
      const organizationUserRole = yield* Effect.promise(() =>
        OrganizationUserRoleService.create(input)
      )

      return yield* HttpServerResponse.json(
        {
          data: organizationUserRole
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
        OrganizationUserRolePathParams
      )
      const input = yield* HttpServerRequest.schemaBodyJson(
        UpdateOrganizationUserRoleInput
      )
      const organizationUserRole = yield* Effect.promise(() =>
        OrganizationUserRoleService.updateById(id, input)
      )

      if (organizationUserRole === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: organizationUserRole
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(
        OrganizationUserRolePathParams
      )
      const deleted = yield* Effect.promise(() =>
        OrganizationUserRoleService.deleteById(id)
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
