import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { authentications, users } from "../db/schema.js"
import type { User } from "../user/user.model.js"

type AuthenticatedUser = User & {
  passwordHash: string
}

const toUser = (
  user: typeof users.$inferSelect,
  authentication: typeof authentications.$inferSelect
): AuthenticatedUser => {
  const name =
    user.displayName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    user.email

  return {
    id: user.id,
    name: name === "" ? user.email : name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    passwordHash: authentication.passwordHash
  }
}

export const AuthStorage = {
  findByEmailWithPassword: async (
    email: string
  ): Promise<AuthenticatedUser | undefined> => {
    const [row] = await db
      .select({
        user: users,
        authentication: authentications
      })
      .from(authentications)
      .innerJoin(users, eq(authentications.userId, users.id))
      .where(
        and(
          eq(users.email, email),
          isNull(users.deletedAt)
        )
      )
      .limit(1)

    if (
      row === undefined ||
      !row.user.isActive ||
      (row.authentication.lockedUntil !== null &&
        row.authentication.lockedUntil > new Date())
    ) {
      return undefined
    }

    return toUser(row.user, row.authentication)
  },

  createForUser: async (input: {
    userId: string
    passwordHash: string
  }): Promise<void> => {
    await db.insert(authentications).values({
      userId: input.userId,
      passwordHash: input.passwordHash
    })
  }
}
