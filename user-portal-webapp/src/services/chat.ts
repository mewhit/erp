import { Data, Effect, Schema } from "effect";
import { apiBaseUrl, getWebSocketUrl } from "../config";
import { getStoredSession } from "./auth";

export type ChatMessage = {
  id: string;
  organizationId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  sentAt: string;
  clientMessageId?: string;
};

export type ChatServerEvent =
  | {
      type: "connected";
      userId: string;
    }
  | {
      type: "message";
      message: ChatMessage;
    }
  | {
      type: "delivery";
      messageId: string;
      clientMessageId?: string;
      delivered: boolean;
    }
  | {
      type: "error";
      message: string;
    };

const ChatMessageSchema = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  fromUserId: Schema.String,
  toUserId: Schema.String,
  text: Schema.String,
  sentAt: Schema.String,
  clientMessageId: Schema.optional(Schema.String)
});

const ChatMessagesResponseSchema = Schema.Struct({
  data: Schema.Array(ChatMessageSchema)
});

class ChatApiError extends Data.TaggedError("ChatApiError")<{
  message: string;
  status?: number;
}> {}

export const getChatWebSocketUrl = (
  token: string,
  organizationId: string
): string => {
  const url = new URL(getWebSocketUrl("/chat/ws"));
  url.searchParams.set("token", token);
  url.searchParams.set("organizationId", organizationId);
  return url.toString();
};

export const getChatConversation = (
  organizationId: string,
  userId: string
): Effect.Effect<ReadonlyArray<ChatMessage>, ChatApiError> => {
  if (organizationId === "" || userId === "") {
    return Effect.succeed([]);
  }

  const session = getStoredSession();

  if (session === undefined) {
    return Effect.succeed([]);
  }

  const url = new URL(`${apiBaseUrl}/chat/messages/${encodeURIComponent(userId)}`);
  url.searchParams.set("organizationId", organizationId);

  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(url, {
          headers: {
            Authorization: `Bearer ${session.token}`
          }
        }),
      catch: (error) =>
        new ChatApiError({
          message: error instanceof Error ? error.message : "Unable to load chat"
        })
    });

    const body = yield* Effect.tryPromise({
      try: () => response.json() as Promise<unknown>,
      catch: (error) =>
        new ChatApiError({
          message:
            error instanceof Error ? error.message : "Unable to parse chat response",
          status: response.status
        })
    });

    if (!response.ok) {
      return yield* Effect.fail(
        new ChatApiError({
          message: "Unable to load chat",
          status: response.status
        })
      );
    }

    return yield* Schema.decodeUnknown(ChatMessagesResponseSchema)(body).pipe(
      Effect.map((responseBody) => responseBody.data),
      Effect.mapError(
        (error) =>
          new ChatApiError({
            message: String(error),
            status: response.status
          })
      )
    );
  });
};

export const parseChatServerEvent = (value: string): ChatServerEvent | undefined => {
  try {
    const event = JSON.parse(value) as Partial<ChatServerEvent>;

    if (event.type === "connected" && typeof event.userId === "string") {
      return {
        type: "connected",
        userId: event.userId
      };
    }

    if (
      event.type === "message" &&
      typeof event.message === "object" &&
      event.message !== null
    ) {
      return event as ChatServerEvent;
    }

    if (
      event.type === "delivery" &&
      typeof event.messageId === "string" &&
      typeof event.delivered === "boolean"
    ) {
      return {
        type: "delivery",
        messageId: event.messageId,
        clientMessageId:
          typeof event.clientMessageId === "string" ? event.clientMessageId : undefined,
        delivered: event.delivered
      };
    }

    if (event.type === "error" && typeof event.message === "string") {
      return {
        type: "error",
        message: event.message
      };
    }

    return undefined;
  } catch {
    return undefined;
  }
};
