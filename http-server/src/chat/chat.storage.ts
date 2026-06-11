import { and, asc, eq, or } from "drizzle-orm"
import { db } from "../db/client.js"
import { chatMessages } from "../db/schema.js"
import type { ChatMessage, CreateChatMessageInput } from "./chat.model.js"

const toChatMessage = (
  chatMessage: typeof chatMessages.$inferSelect
): ChatMessage => ({
  id: chatMessage.id,
  organizationId: chatMessage.organizationId,
  fromUserId: chatMessage.fromUserId,
  toUserId: chatMessage.toUserId,
  text: chatMessage.text,
  sentAt: chatMessage.createdAt.toISOString(),
  ...(chatMessage.clientMessageId === null
    ? {}
    : { clientMessageId: chatMessage.clientMessageId })
})

export const ChatStorage = {
  create: async (input: CreateChatMessageInput): Promise<ChatMessage> => {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values({
        organizationId: input.organizationId,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        text: input.text,
        clientMessageId: input.clientMessageId
      })
      .returning()

    return toChatMessage(chatMessage)
  },

  findConversation: async (input: {
    organizationId: string
    userId: string
    otherUserId: string
  }): Promise<ReadonlyArray<ChatMessage>> => {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.organizationId, input.organizationId),
          or(
            and(
              eq(chatMessages.fromUserId, input.userId),
              eq(chatMessages.toUserId, input.otherUserId)
            ),
            and(
              eq(chatMessages.fromUserId, input.otherUserId),
              eq(chatMessages.toUserId, input.userId)
            )
          )
        )
      )
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id))

    return rows.map(toChatMessage)
  }
}
