import { eq } from "drizzle-orm"
import { hashPassword } from "../auth/password.js"
import { closeDb, db } from "./client.js"
import { authentications, organizations, roles, users } from "./schema.js"

const seededAt = new Date("2026-01-01T00:00:00.000Z")
const mikeEmail = "mikewhittom27@gmail.com"
const mikePassword = "password123"

try {
  const mikePasswordHash = await hashPassword(mikePassword)

  await db
    .insert(organizations)
    .values({
      name: "Mewhit",
      slug: "MEWHIT",
      createdAt: seededAt,
      updatedAt: seededAt
    })
    .onConflictDoNothing({ target: organizations.slug })

  await db
    .insert(roles)
    .values([
      {
        name: "Admin",
        code: "ADMIN",
        createdAt: seededAt,
        updatedAt: seededAt
      },
      {
        name: "User",
        code: "USER",
        createdAt: seededAt,
        updatedAt: seededAt
      }
    ])
    .onConflictDoNothing({ target: roles.code })

  await db
    .insert(users)
    .values({
      displayName: "Mike",
      email: mikeEmail,
      createdAt: seededAt,
      updatedAt: seededAt
    })
    .onConflictDoNothing({ target: users.email })

  const [mike] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, mikeEmail))
    .limit(1)

  if (!mike) {
    throw new Error(`Seed user ${mikeEmail} was not found`)
  }

  await db
    .insert(authentications)
    .values({
      userId: mike.id,
      passwordHash: mikePasswordHash,
      createdAt: seededAt,
      updatedAt: seededAt
    })
    .onConflictDoUpdate({
      target: authentications.userId,
      set: {
        passwordHash: mikePasswordHash,
        updatedAt: seededAt
      }
    })

  console.log("Seed data applied")
} finally {
  await closeDb()
}
