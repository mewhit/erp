import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { organizations } from "../db/schema.js"
import type {
  CreateOrganizationInput,
  Organization
} from "./organization.model.js"

const toOrganization = (
  organization: typeof organizations.$inferSelect
): Organization => ({
  id: organization.id,
  name: organization.name,
  code: organization.slug,
  createdAt: organization.createdAt.toISOString()
})

export const OrganizationStorage = {
  findAll: async (): Promise<ReadonlyArray<Organization>> => {
    const rows = await db
      .select()
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .orderBy(organizations.id)

    return rows.map(toOrganization)
  },

  findById: async (id: string): Promise<Organization | undefined> => {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, id), isNull(organizations.deletedAt)))
      .limit(1)

    return organization === undefined ? undefined : toOrganization(organization)
  },

  create: async (input: CreateOrganizationInput): Promise<Organization> => {
    const [organization] = await db
      .insert(organizations)
      .values({
        name: input.name,
        slug: input.code
      })
      .returning()

    return toOrganization(organization)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [organization] = await db
      .update(organizations)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(organizations.id, id), isNull(organizations.deletedAt)))
      .returning({ id: organizations.id })

    return organization !== undefined
  }
}
