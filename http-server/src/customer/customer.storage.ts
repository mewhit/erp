import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { customers } from "../db/schema.js"
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput
} from "./customer.model.js"

const toCustomer = (customer: typeof customers.$inferSelect): Customer => ({
  id: customer.id,
  firstName: customer.firstName,
  lastName: customer.lastName,
  email: customer.email,
  phone: customer.phone ?? "",
  isActive: customer.isActive,
  createdAt: customer.createdAt.toISOString()
})

export const CustomerStorage = {
  findAll: async (): Promise<ReadonlyArray<Customer>> => {
    const rows = await db
      .select()
      .from(customers)
      .where(isNull(customers.deletedAt))
      .orderBy(customers.id)

    return rows.map(toCustomer)
  },

  findById: async (id: string): Promise<Customer | undefined> => {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .limit(1)

    return customer === undefined ? undefined : toCustomer(customer)
  },

  create: async (input: CreateCustomerInput): Promise<Customer> => {
    const [customer] = await db
      .insert(customers)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone
      })
      .returning()

    return toCustomer(customer)
  },

  updateById: async (
    id: string,
    input: UpdateCustomerInput
  ): Promise<Customer | undefined> => {
    const [customer] = await db
      .update(customers)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        isActive: input.isActive,
        updatedAt: new Date()
      })
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .returning()

    return customer === undefined ? undefined : toCustomer(customer)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [customer] = await db
      .update(customers)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(customers.id, id), isNull(customers.deletedAt)))
      .returning({ id: customers.id })

    return customer !== undefined
  }
}
