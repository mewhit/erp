import {
  HttpMiddleware,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Context, Effect } from "effect"
import { AuthService } from "./auth.service.js"

export class AuthenticatedUserId extends Context.Tag("AuthenticatedUserId")<
  AuthenticatedUserId,
  string
>() {}

export const getBearerToken = (
  authorization: string | undefined
): string | undefined => {
  if (authorization === undefined) {
    return undefined
  }

  const [scheme, token] = authorization.split(" ")

  if (scheme?.toLowerCase() !== "bearer" || token === undefined) {
    return undefined
  }

  return token
}

const getChatWebSocketToken = (
  request: HttpServerRequest.HttpServerRequest
): string | undefined => {
  if (!request.originalUrl.startsWith("/chat/ws")) {
    return undefined
  }

  try {
    const host = request.headers.host ?? "localhost"
    const protocol =
      request.headers["x-forwarded-proto"] === "https" ? "https" : "http"
    const url = new URL(request.originalUrl, `${protocol}://${host}`)

    return url.searchParams.get("token") ?? undefined
  } catch {
    return undefined
  }
}

const unauthorized = () =>
  HttpServerResponse.json(
    {
      message: "Unauthorized"
    },
    {
      status: 401
    }
  )

export const authGuard = HttpMiddleware.make((app) =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest

    const token =
      getBearerToken(request.headers.authorization) ??
      getChatWebSocketToken(request)

    if (token === undefined) {
      return yield* unauthorized()
    }

    const userId = AuthService.getUserIdByToken(token)

    if (userId === undefined) {
      return yield* unauthorized()
    }

    return yield* app.pipe(Effect.provideService(AuthenticatedUserId, userId))
  })
)
