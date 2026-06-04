import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { users } from "../db/schema.js"
import type { User } from "./user.model.js"

const toUser = (user: typeof users.$inferSelect): User => {
  const name =
    user.displayName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    user.email

  return {
    id: user.id,
    name: name === "" ? user.email : name,
    email: user.email,
    createdAt: user.createdAt.toISOString()
  }
}

export const UserStorage = {
  findAll: async (): Promise<ReadonlyArray<User>> => {
    const rows = await db
      .select()
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(users.id)

    return rows.map(toUser)
  },

  findById: async (id: string): Promise<User | undefined> => {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)

    return user === undefined ? undefined : toUser(user)
  },

  create: async (input: { name: string; email: string }): Promise<User> => {
    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        displayName: input.name
      })
      .returning()

    return toUser(user)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [user] = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .returning({ id: users.id })

    return user !== undefined
  }
}
