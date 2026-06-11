import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect, Schema } from "effect"
import { AuthenticatedUserId } from "./auth.guard.js"
import {
  CreateUserAuthenticationInput,
  LoginInput
} from "./auth.model.js"
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

const AuthUserPathParams = Schema.Struct({
  userId: Schema.String
})

const userNotFound = (userId: string) =>
  HttpServerResponse.json(
    {
      message: `User ${userId} not found`
    },
    {
      status: 404
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

      return yield* HttpServerResponse.json({
        data: {
          userId
        }
      })
    })
  ),

  HttpRouter.post(
    "/users/:userId/password",
    Effect.gen(function* () {
      const { userId } = yield* HttpRouter.schemaPathParams(AuthUserPathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateUserAuthenticationInput
      )
      const created = yield* Effect.promise(() =>
        AuthService.createForUser(userId, input)
      )

      if (!created) {
        return yield* userNotFound(userId)
      }

      return yield* HttpServerResponse.json(
        {
          data: {
            userId
          }
        },
        {
          status: 201
        }
      )
    })
  ),

  HttpRouter.put(
    "/users/:userId/password",
    Effect.gen(function* () {
      const { userId } = yield* HttpRouter.schemaPathParams(AuthUserPathParams)
      const input = yield* HttpServerRequest.schemaBodyJson(
        CreateUserAuthenticationInput
      )
      const updated = yield* Effect.promise(() =>
        AuthService.setPasswordForUser(userId, input)
      )

      if (!updated) {
        return yield* userNotFound(userId)
      }

      return yield* HttpServerResponse.json({
        data: {
          userId
        }
      })
    })
  )
)
