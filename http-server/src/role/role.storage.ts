import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { roles } from "../db/schema.js"
import type { CreateRoleInput, Role, UpdateRoleInput } from "./role.model.js"

const toRole = (role: typeof roles.$inferSelect): Role => ({
  id: role.id,
  name: role.name,
  code: role.code,
  isActive: role.isActive,
  createdAt: role.createdAt.toISOString()
})

export const RoleStorage = {
  findAll: async (): Promise<ReadonlyArray<Role>> => {
    const rows = await db
      .select()
      .from(roles)
      .where(isNull(roles.deletedAt))
      .orderBy(roles.id)

    return rows.map(toRole)
  },

  findById: async (id: string): Promise<Role | undefined> => {
    const [role] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
      .limit(1)

    return role === undefined ? undefined : toRole(role)
  },

  create: async (input: CreateRoleInput): Promise<Role> => {
    const [role] = await db
      .insert(roles)
      .values({
        name: input.name,
        code: input.code
      })
      .returning()

    return toRole(role)
  },

  updateById: async (
    id: string,
    input: UpdateRoleInput
  ): Promise<Role | undefined> => {
    const [role] = await db
      .update(roles)
      .set({
        name: input.name,
        code: input.code,
        isActive: input.isActive,
        updatedAt: new Date()
      })
      .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
      .returning()

    return role === undefined ? undefined : toRole(role)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [role] = await db
      .update(roles)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(roles.id, id), isNull(roles.deletedAt)))
      .returning({ id: roles.id })

    return role !== undefined
  }
}
