import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect } from "effect"
import { UserService } from "../user/user.service.js"
import { AuthenticatedUserId } from "./auth.guard.js"
import { LoginInput } from "./auth.model.js"
import { AuthService } from "./auth.service.js"

const unauthorized = () =>
  HttpServerResponse.json(
    {
      message: "Invalid email or password"
    },
    {
      status: 401
    }
  )

export const authPublicRoutes = HttpRouter.empty.pipe(
  HttpRouter.post(
    "/login",
    Effect.gen(function* () {
      const input = yield* HttpServerRequest.schemaBodyJson(LoginInput)
      const session = yield* Effect.promise(() => AuthService.login(input))

      if (session === undefined) {
        return yield* unauthorized()
      }

      return yield* HttpServerResponse.json({
        data: session
      })
    })
  )
)

export const authRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/me",
    Effect.gen(function* () {
      const userId = yield* AuthenticatedUserId
      const user = yield* Effect.promise(() => UserService.findById(userId))

      if (user === undefined) {
        return yield* unauthorized()
      }

      return yield* HttpServerResponse.json({
        data: user
      })
    })
  )
)
