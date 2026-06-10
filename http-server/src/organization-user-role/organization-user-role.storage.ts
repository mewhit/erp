import { eq } from "drizzle-orm"
import { db } from "../db/client.js"
import { organizationUserRoles } from "../db/schema.js"
import type {
  CreateOrganizationUserRoleInput,
  OrganizationUserRole,
  UpdateOrganizationUserRoleInput
} from "./organization-user-role.model.js"

const toOrganizationUserRole = (
  organizationUserRole: typeof organizationUserRoles.$inferSelect
): OrganizationUserRole => ({
  id: organizationUserRole.id,
  organizationId: organizationUserRole.organizationId,
  userId: organizationUserRole.userId,
  roleId: organizationUserRole.roleId,
  createdAt: organizationUserRole.createdAt.toISOString()
})

export const OrganizationUserRoleStorage = {
  findAll: async (): Promise<ReadonlyArray<OrganizationUserRole>> => {
    const rows = await db
      .select()
      .from(organizationUserRoles)
      .orderBy(organizationUserRoles.id)

    return rows.map(toOrganizationUserRole)
  },

  findById: async (id: string): Promise<OrganizationUserRole | undefined> => {
    const [organizationUserRole] = await db
      .select()
      .from(organizationUserRoles)
      .where(eq(organizationUserRoles.id, id))
      .limit(1)

    return organizationUserRole === undefined
      ? undefined
      : toOrganizationUserRole(organizationUserRole)
  },

  findByUserId: async (
    userId: string
  ): Promise<ReadonlyArray<OrganizationUserRole>> => {
    const rows = await db
      .select()
      .from(organizationUserRoles)
      .where(eq(organizationUserRoles.userId, userId))
      .orderBy(organizationUserRoles.id)

    return rows.map(toOrganizationUserRole)
  },

  create: async (
    input: CreateOrganizationUserRoleInput
  ): Promise<OrganizationUserRole> => {
    const [organizationUserRole] = await db
      .insert(organizationUserRoles)
      .values({
        organizationId: input.organizationId,
        userId: input.userId,
        roleId: input.roleId
      })
      .returning()

    return toOrganizationUserRole(organizationUserRole)
  },

  updateById: async (
    id: string,
    input: UpdateOrganizationUserRoleInput
  ): Promise<OrganizationUserRole | undefined> => {
    const [organizationUserRole] = await db
      .update(organizationUserRoles)
      .set({
        organizationId: input.organizationId,
        userId: input.userId,
        roleId: input.roleId,
        updatedAt: new Date()
      })
      .where(eq(organizationUserRoles.id, id))
      .returning()

    return organizationUserRole === undefined
      ? undefined
      : toOrganizationUserRole(organizationUserRole)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [organizationUserRole] = await db
      .delete(organizationUserRoles)
      .where(eq(organizationUserRoles.id, id))
      .returning({ id: organizationUserRoles.id })

    return organizationUserRole !== undefined
  }
}
