import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect } from "effect"
import {
  AddCustomerInput,
  AddUserInput,
  AddWorkOrderToCustomerInput
} from "./usecase.model.js"
import { UsecaseService } from "./usecase.service.js"

const addWorkOrderToCustomerHandler = Effect.gen(function* () {
  const input = yield* HttpServerRequest.schemaBodyJson(
    AddWorkOrderToCustomerInput
  )

  return yield* UsecaseService.addWorkOrderToCustomer(input).pipe(
    Effect.matchEffect({
      onFailure: (error) =>
        HttpServerResponse.json(
          {
            message: "Unable to add work order to customer",
            phase: error.phase
          },
          {
            status: 400
          }
        ),
      onSuccess: (result) =>
        HttpServerResponse.json(
          {
            data: result
          },
          {
            status: 201
          }
        )
    })
  )
})

export const usecaseRoutes = HttpRouter.empty.pipe(
  HttpRouter.post("/add-work-order-to-customer", addWorkOrderToCustomerHandler),

  HttpRouter.post(
    "/add-customer",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(AddCustomerInput)

      return yield* UsecaseService.addCustomer(input).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to add customer",
                phase: error.phase
              },
              {
                status: 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json(
              {
                data: result
              },
              {
                status: 201
              }
            )
        })
      )
    })
  ),

  HttpRouter.post(
    "/add-user",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(AddUserInput)

      return yield* UsecaseService.addUser(input).pipe(
        Effect.matchEffect({
          onFailure: (error) =>
            HttpServerResponse.json(
              {
                message: "Unable to add user",
                phase: error.phase
              },
              {
                status: 400
              }
            ),
          onSuccess: (result) =>
            HttpServerResponse.json(
              {
                data: result
              },
              {
                status: 201
              }
            )
        })
      )
    })
  )
)
