import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse
} from "@effect/platform"
import { Socket } from "@effect/platform"
import { Effect, Schema } from "effect"
import { createApiClient } from "../shared/api-client/index.js"
import { verifyAuthToken } from "../shared/auth-token/index.js"
import type { ChatServerEvent } from "./chat.model.js"
import { ChatService } from "./chat.service.js"
import { ChatStorage } from "./chat.storage.js"

const OrganizationUserRole = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String,
  createdAt: Schema.String
})

const OrganizationUserRolesResponse = Schema.Struct({
  data: Schema.Array(OrganizationUserRole)
})

const ChatConversationPathParams = Schema.Struct({
  userId: Schema.String
})

const getBearerToken = (
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

const getToken = (request: HttpServerRequest.HttpServerRequest) => {
  const authorizationToken = getBearerToken(request.headers.authorization)

  if (authorizationToken !== undefined) {
    return authorizationToken
  }

  const url = getRequestUrl(request)

  if (url === undefined) {
    return undefined
  }

  return url.searchParams.get("token") ?? undefined
}

const getOrganizationId = (request: HttpServerRequest.HttpServerRequest) => {
  const url = getRequestUrl(request)

  if (url === undefined) {
    return undefined
  }

  return url.searchParams.get("organizationId") ?? undefined
}

const getRequestUrl = (
  request: HttpServerRequest.HttpServerRequest
): URL | undefined => {
  try {
    const host = request.headers.host ?? "localhost"
    const protocol = request.headers["x-forwarded-proto"] === "https"
      ? "https"
      : "http"

    return new URL(request.originalUrl, `${protocol}://${host}`)
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

const forbidden = () =>
  HttpServerResponse.json(
    {
      message: "Forbidden"
    },
    {
      status: 403
    }
  )

const authorizeChatRequest = (
  request: HttpServerRequest.HttpServerRequest
) =>
  Effect.gen(function* () {
    const token = getToken(request)
    const payload = token === undefined ? undefined : verifyAuthToken(token)
    const organizationId = getOrganizationId(request)

    if (payload === undefined || organizationId === undefined) {
      return yield* unauthorized()
    }

    const apiClient = createApiClient({
      headers: {
        Authorization: request.headers.authorization ?? `Bearer ${token}`
      }
    })
    const organizationUserRolesResponse =
      yield* apiClient.organizationUserRole
        .byOrganizationId(organizationId)
        .pipe(
          Effect.flatMap(Schema.decodeUnknown(OrganizationUserRolesResponse)),
          Effect.catchAll(() => forbidden())
        )

    if ("status" in organizationUserRolesResponse) {
      return organizationUserRolesResponse
    }

    const organizationUserIds = new Set(
      organizationUserRolesResponse.data.map(
        (organizationUserRole) => organizationUserRole.userId
      )
    )

    if (!organizationUserIds.has(payload.userId)) {
      return yield* forbidden()
    }

    return {
      organizationId,
      userId: payload.userId,
      organizationUserIds
    }
  })

export const chatRoutes = HttpRouter.empty.pipe(
  HttpRouter.get(
    "/messages/:userId",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const { userId: otherUserId } = yield* HttpRouter.schemaPathParams(
        ChatConversationPathParams
      )
      const authorization = yield* authorizeChatRequest(request)

      if ("status" in authorization) {
        return authorization
      }

      if (!authorization.organizationUserIds.has(otherUserId)) {
        return yield* forbidden()
      }

      const messages = yield* Effect.tryPromise({
        try: () =>
          ChatStorage.findConversation({
            organizationId: authorization.organizationId,
            userId: authorization.userId,
            otherUserId
          }),
        catch: () => []
      })

      return yield* HttpServerResponse.json({
        data: messages
      })
    })
  ),

  HttpRouter.get(
    "/ws",
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest
      const authorization = yield* authorizeChatRequest(request)

      if ("status" in authorization) {
        return authorization
      }

      const chatService = yield* ChatService
      const socket = yield* request.upgrade
      const writer = yield* socket.writer
      const send = (event: ChatServerEvent) => writer(JSON.stringify(event))
      const clientId = yield* chatService.connect(authorization.userId, send)

      yield* socket.runRaw(
        (data) =>
          chatService.receive(
            authorization.organizationId,
            authorization.userId,
            data,
            authorization.organizationUserIds
          ).pipe(
            Effect.catchTag("InvalidChatMessage", () =>
              send({
                type: "error",
                message: "Invalid chat message"
              })
            ),
            Effect.catchTag("ChatRecipientNotAllowed", () =>
              send({
                type: "error",
                message: "Recipient is not in this organization"
              })
            )
          ),
        {
          onOpen: send({
            type: "connected",
            userId: authorization.userId
          }).pipe(Effect.catchAll(() => Effect.void))
        }
      ).pipe(
        Effect.catchIf(
          (error) => Socket.SocketCloseError.is(error),
          () => Effect.void
        ),
        Effect.ensuring(chatService.disconnect(authorization.userId, clientId))
      )

      return yield* HttpServerResponse.empty()
    })
  )
)
