import { eq } from "drizzle-orm"
import { db } from "../db/client.js"
import { organizationCustomers } from "../db/schema.js"
import type {
  CreateOrganizationCustomerInput,
  OrganizationCustomer,
  UpdateOrganizationCustomerInput
} from "./organization-customer.model.js"

const toOrganizationCustomer = (
  organizationCustomer: typeof organizationCustomers.$inferSelect
): OrganizationCustomer => ({
  id: organizationCustomer.id,
  organizationId: organizationCustomer.organizationId,
  customerId: organizationCustomer.customerId,
  createdAt: organizationCustomer.createdAt.toISOString()
})

export const OrganizationCustomerStorage = {
  findAll: async (): Promise<ReadonlyArray<OrganizationCustomer>> => {
    const rows = await db
      .select()
      .from(organizationCustomers)
      .orderBy(organizationCustomers.id)

    return rows.map(toOrganizationCustomer)
  },

  findById: async (id: string): Promise<OrganizationCustomer | undefined> => {
    const [organizationCustomer] = await db
      .select()
      .from(organizationCustomers)
      .where(eq(organizationCustomers.id, id))
      .limit(1)

    return organizationCustomer === undefined
      ? undefined
      : toOrganizationCustomer(organizationCustomer)
  },

  create: async (
    input: CreateOrganizationCustomerInput
  ): Promise<OrganizationCustomer> => {
    const [organizationCustomer] = await db
      .insert(organizationCustomers)
      .values({
        organizationId: input.organizationId,
        customerId: input.customerId
      })
      .returning()

    return toOrganizationCustomer(organizationCustomer)
  },

  updateById: async (
    id: string,
    input: UpdateOrganizationCustomerInput
  ): Promise<OrganizationCustomer | undefined> => {
    const [organizationCustomer] = await db
      .update(organizationCustomers)
      .set({
        organizationId: input.organizationId,
        customerId: input.customerId,
        updatedAt: new Date()
      })
      .where(eq(organizationCustomers.id, id))
      .returning()

    return organizationCustomer === undefined
      ? undefined
      : toOrganizationCustomer(organizationCustomer)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [organizationCustomer] = await db
      .delete(organizationCustomers)
      .where(eq(organizationCustomers.id, id))
      .returning({ id: organizationCustomers.id })

    return organizationCustomer !== undefined
  }
}
