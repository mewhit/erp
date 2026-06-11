import type * as Socket from "@effect/platform/Socket"
import { Data, Effect, Ref, Schema } from "effect"
import { randomUUID } from "node:crypto"
import {
  type ChatServerEvent,
  SendChatMessageInput,
  type SendChatMessageInput as SendChatMessageInputType
} from "./chat.model.js"
import { ChatStorage } from "./chat.storage.js"

type ClientId = string

type ConnectedClient = {
  id: ClientId
  userId: string
  send: (event: ChatServerEvent) => Effect.Effect<void, Socket.SocketError>
}

type ClientRegistry = ReadonlyMap<string, ReadonlyMap<ClientId, ConnectedClient>>

const clients = Ref.unsafeMake<ClientRegistry>(new Map())

export class InvalidChatMessage extends Data.TaggedError(
  "InvalidChatMessage"
)<{
  readonly cause: unknown
}> {}

export class ChatRecipientNotAllowed extends Data.TaggedError(
  "ChatRecipientNotAllowed"
)<{
  readonly toUserId: string
}> {}

export class ChatService extends Effect.Service<ChatService>()("ChatService", {
  effect: Effect.gen(function* () {
    const connectedClientsForUser = (userId: string) =>
      Effect.map(Ref.get(clients), (registry) =>
        Array.from(registry.get(userId)?.values() ?? [])
      )

    const removeClient = (client: ConnectedClient) =>
      Ref.update(clients, (registry) => {
        const userClients = registry.get(client.userId)

        if (userClients === undefined) {
          return registry
        }

        const next = new Map(registry)
        const nextUserClients = new Map(userClients)
        nextUserClients.delete(client.id)

        if (nextUserClients.size === 0) {
          next.delete(client.userId)
        } else {
          next.set(client.userId, nextUserClients)
        }

        return next
      })

    const sendToClient = (
      client: ConnectedClient,
      event: ChatServerEvent
    ): Effect.Effect<void> =>
      client.send(event).pipe(
        Effect.timeout("500 millis"),
        Effect.catchAll((error) =>
          Effect.logWarning("Unable to send chat event").pipe(
            Effect.annotateLogs({
              clientId: client.id,
              userId: client.userId,
              error: String(error)
            }),
            Effect.zipRight(removeClient(client))
          )
        )
      )

    const sendToUser = (userId: string, event: ChatServerEvent) =>
      connectedClientsForUser(userId).pipe(
        Effect.flatMap((userClients) =>
          Effect.forEach(userClients, (client) => sendToClient(client, event), {
            discard: true,
            concurrency: "unbounded"
          })
        ),
        Effect.as(userId)
      )

    const parseClientMessage = (
      data: string | Uint8Array
    ): Effect.Effect<SendChatMessageInputType, InvalidChatMessage> => {
      const text =
        typeof data === "string" ? data : new TextDecoder().decode(data)

      return Effect.try({
        try: () => JSON.parse(text) as unknown,
        catch: (cause) => new InvalidChatMessage({ cause })
      }).pipe(
        Effect.flatMap((value) =>
          Schema.decodeUnknown(SendChatMessageInput)(value).pipe(
            Effect.mapError((cause) => new InvalidChatMessage({ cause }))
          )
        )
      )
    }

    return {
      connect: (
        userId: string,
        send: (event: ChatServerEvent) => Effect.Effect<void, Socket.SocketError>
      ) =>
        Effect.gen(function* () {
          const client: ConnectedClient = {
            id: randomUUID(),
            userId,
            send
          }

          yield* Ref.update(clients, (registry) => {
            const next = new Map(registry)
            const userClients = new Map(next.get(userId) ?? [])
            userClients.set(client.id, client)
            next.set(userId, userClients)
            return next
          })

          return client.id
        }),

      disconnect: (userId: string, clientId: ClientId) =>
        Ref.update(clients, (registry) => {
          const userClients = registry.get(userId)

          if (userClients === undefined) {
            return registry
          }

          const next = new Map(registry)
          const nextUserClients = new Map(userClients)
          nextUserClients.delete(clientId)

          if (nextUserClients.size === 0) {
            next.delete(userId)
          } else {
            next.set(userId, nextUserClients)
          }

          return next
        }),

      receive: (
        organizationId: string,
        fromUserId: string,
        data: string | Uint8Array,
        allowedRecipientIds: ReadonlySet<string>
      ) =>
        Effect.gen(function* () {
          const input = yield* parseClientMessage(data)

          if (!allowedRecipientIds.has(input.toUserId)) {
            return yield* Effect.fail(
              new ChatRecipientNotAllowed({
                toUserId: input.toUserId
              })
            )
          }

          const message = yield* Effect.tryPromise({
            try: () =>
              ChatStorage.create({
                organizationId,
                fromUserId,
                toUserId: input.toUserId,
                text: input.text,
                clientMessageId:
                  input.clientMessageId === ""
                    ? undefined
                    : input.clientMessageId
              }),
            catch: (cause) => new InvalidChatMessage({ cause })
          })
          const recipientClients = yield* connectedClientsForUser(input.toUserId)
          const delivered = recipientClients.length > 0

          yield* Effect.forEach(
            recipientClients,
            (client) =>
              sendToClient(client, {
                type: "message",
                message
              }),
            {
              discard: true,
              concurrency: "unbounded"
            }
          )

          yield* sendToUser(fromUserId, {
            type: "message",
            message
          })
          yield* sendToUser(fromUserId, {
            type: "delivery",
            messageId: message.id,
            ...(input.clientMessageId === ""
              ? {}
              : { clientMessageId: input.clientMessageId }),
            delivered
          })
        })
    } as const
  })
}) {}

export const ChatServiceLive = ChatService.Default
