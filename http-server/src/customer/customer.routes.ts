import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import {
  CreateCustomerInput,
  UpdateCustomerInput
} from "./customer.model.js"
import { CustomerService } from "./customer.service.js"

const CustomerPathParams = Schema.Struct({
  id: Schema.String
})

const notFound = (id: string) =>
  HttpServerResponse.json(
    {
      message: `Customer ${id} not found`
    },
    {
      status: 404
    }
  )

export const customerRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/",
    Effect.gen(function* () {
      const customers = yield* Effect.promise(() => CustomerService.findAll())

      return yield* HttpServerResponse.json({
        data: customers
      })
    })
  ),

  HttpRouter.get(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(CustomerPathParams)
      const customer = yield* Effect.promise(() => CustomerService.findById(id))

      if (customer === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: customer
      })
    })
  ),

  HttpRouter.post(
    "/",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateCustomerInput
      )
      const customer = yield* Effect.promise(() => CustomerService.create(input))

      return yield* HttpServerResponse.json(
        {
          data: customer
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
      const { id } = yield* HttpRouter.schemaPathParams(CustomerPathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(
        UpdateCustomerInput
      )
      const customer = yield* Effect.promise(() =>
        CustomerService.updateById(id, input)
      )

      if (customer === undefined) {
        return yield* notFound(id)
      }

      return yield* HttpServerResponse.json({
        data: customer
      })
    })
  ),

  HttpRouter.del(
    "/:id",
    Effect.gen(function* () {
      const { id } = yield* HttpRouter.schemaPathParams(CustomerPathParams)
      const deleted = yield* Effect.promise(() => CustomerService.deleteById(id))

      if (!deleted) {
        return yield* notFound(id)
      }

      return HttpServerResponse.empty({
        status: 204
      })
    })
  )
)
