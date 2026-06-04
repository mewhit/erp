import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import { CreateOrganizationInput } from "./organization.model.js"
import { OrganizationService } from "./organization.service.js"

const OrganizationPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `Organization ${id} not found`
    },
    {
      status: 404
    }
  )

export const organizationRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const organizations = yield* Effect.promise(() =>
        OrganizationService.findAll()
      )

      return yield* HttpServerResponse.json({
        data: organizations
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(OrganizationPathParams)
      const organization = yield* Effect.promise(() =>
        OrganizationService.findById(id)
      )

      if (organization === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: organization
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateOrganizationInput
      )
      const organization = yield* Effect.promise(() =>
        OrganizationService.create(input)
      )

      return yield* HttpServerResponse.json(
        {
          data: organization
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
      const { id } = yield* HttpRouter.schemaPathParams(OrganizationPathParams)
      const deleted = yield* Effect.promise(() =>
        OrganizationService.deleteById(id)
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
