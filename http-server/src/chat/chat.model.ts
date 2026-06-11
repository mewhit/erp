import { Schema } from "effect"

export const SendChatMessageInput = Schema.Struct({
  type: Schema.Literal("send_message"),
  toUserId: Schema.String,
  text: Schema.String,
  clientMessageId: Schema.optionalWith(Schema.String, { default: () => "" })
})

export type SendChatMessageInput = typeof SendChatMessageInput.Type

export type ChatMessage = {
  id: string
  organizationId: string
  fromUserId: string
  toUserId: string
  text: string
  sentAt: string
  clientMessageId?: string
}

export type CreateChatMessageInput = {
  organizationId: string
  fromUserId: string
  toUserId: string
  text: string
  clientMessageId?: string
}

export type ChatServerEvent =
  | {
      type: "connected"
      userId: string
    }
  | {
      type: "message"
      message: ChatMessage
    }
  | {
      type: "delivery"
      messageId: string
      clientMessageId?: string
      delivered: boolean
    }
  | {
      type: "error"
      message: string
    }
