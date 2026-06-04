import {
  boolean,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core"

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [uniqueIndex("organizations_slug_unique").on(table.slug)]
)

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    displayName: varchar("display_name", { length: 255 }),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    deletedAt: timestamp("deleted_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
)

export const authentications = pgTable(
  "authentications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    passwordUpdatedAt: timestamp("password_updated_at").defaultNow().notNull(),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until"),
    lastLoginAt: timestamp("last_login_at"),
    refreshTokenHash: varchar("refresh_token_hash", { length: 255 }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull()
  },
  (table) => [uniqueIndex("authentications_user_id_unique").on(table.userId)]
)
