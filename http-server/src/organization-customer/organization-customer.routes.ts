import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import {
  CreateOrganizationCustomerInput,
  UpdateOrganizationCustomerInput
} from "./organization-customer.model.js"
import { OrganizationCustomerService } from "./organization-customer.service.js"

const OrganizationCustomerPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `OrganizationCustomer ${id} not found`
    },
    {
      status: 404
    }
  )

export const organizationCustomerRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const organizationCustomers = yield* Effect.promise(() =>
        OrganizationCustomerService.findAll()
      )

      return yield* HttpServerResponse.json({
        data: organizationCustomers
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(
        OrganizationCustomerPathParams
      )
      const organizationCustomer = yield* Effect.promise(() =>
        OrganizationCustomerService.findById(id)
      )

      if (organizationCustomer === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: organizationCustomer
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateOrganizationCustomerInput
      )
      const organizationCustomer = yield* Effect.promise(() =>
        OrganizationCustomerService.create(input)
      )

      return yield* HttpServerResponse.json(
        {
          data: organizationCustomer
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
        OrganizationCustomerPathParams
      )
      const input = yield* HttpServerRequest.schemaBodyJson(
        UpdateOrganizationCustomerInput
      )
      const organizationCustomer = yield* Effect.promise(() =>
        OrganizationCustomerService.updateById(id, input)
      )

      if (organizationCustomer === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: organizationCustomer
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(
        OrganizationCustomerPathParams
      )
      const deleted = yield* Effect.promise(() =>
        OrganizationCustomerService.deleteById(id)
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
