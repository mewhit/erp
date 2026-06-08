import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect } from "effect"
import { AddUserInput } from "./usecase.model.js"
import { UsecaseService } from "./usecase.service.js"

export const usecaseRoutes = HttpRouter.empty.pipe(
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
