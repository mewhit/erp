import { eq } from "drizzle-orm"
import { db } from "../db/client.js"
import { authentications } from "../db/schema.js"

type UserAuthentication = {
  userId: string
  passwordHash: string
}

const toUserAuthentication = (
  authentication: typeof authentications.$inferSelect
): UserAuthentication => ({
  userId: authentication.userId,
  passwordHash: authentication.passwordHash
})

export const AuthStorage = {
  findByEmailWithPassword: async (
    email: string
  ): Promise<UserAuthentication | undefined> => {
    const [authentication] = await db
      .select()
      .from(authentications)
      .where(eq(authentications.email, email))
      .limit(1)

    if (
      authentication === undefined ||
      (authentication.lockedUntil !== null &&
        authentication.lockedUntil > new Date())
    ) {
      return undefined
    }

    return toUserAuthentication(authentication)
  },

  findByUserIdWithPassword: async (
    userId: string
  ): Promise<UserAuthentication | undefined> => {
    const [authentication] = await db
      .select()
      .from(authentications)
      .where(eq(authentications.userId, userId))
      .limit(1)

    if (
      authentication === undefined ||
      (authentication.lockedUntil !== null &&
        authentication.lockedUntil > new Date())
    ) {
      return undefined
    }

    return toUserAuthentication(authentication)
  },

  createForUser: async (input: {
    userId: string
    email: string
    passwordHash: string
  }): Promise<void> => {
    await db.insert(authentications).values({
      userId: input.userId,
      email: input.email,
      passwordHash: input.passwordHash
    })
  },

  setPasswordForUser: async (input: {
    userId: string
    email: string
    passwordHash: string
  }): Promise<boolean> => {
    const now = new Date()

    const [authentication] = await db
      .insert(authentications)
      .values({
        userId: input.userId,
        email: input.email,
        passwordHash: input.passwordHash,
        passwordUpdatedAt: now,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: authentications.userId,
        set: {
          email: input.email,
          passwordHash: input.passwordHash,
          passwordUpdatedAt: now,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: now
        }
      })
      .returning({ userId: authentications.userId })

    return authentication !== undefined
  }
}
