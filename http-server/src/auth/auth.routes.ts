import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Effect } from "effect"
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

const getBearerToken = (authorization: string | undefined): string | undefined => {
  if (authorization === undefined) {
    return undefined
  }

  const [scheme, token] = authorization.split(" ")

  if (scheme?.toLowerCase() !== "bearer" || token === undefined) {
    return undefined
  }

  return token
}

export const authRoutes = HttpRouter.empty.pipe(
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
  ),

  HttpRouter.get(
    "/me",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const token = getBearerToken(request.headers.authorization)

      if (token === undefined) {
        return yield* unauthorized()
      }

      const user = yield* Effect.promise(() => AuthService.findUserByToken(token))

      if (user === undefined) {
        return yield* unauthorized()
      }

      return yield* HttpServerResponse.json({
        data: user
      })
    })
  )
)
