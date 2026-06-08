import { eq } from "drizzle-orm"
import { db } from "../db/client.js"
import { customerWorkOrders } from "../db/schema.js"
import type {
  CreateCustomerWorkOrderInput,
  CustomerWorkOrder,
  UpdateCustomerWorkOrderInput
} from "./customer-work-order.model.js"

const toCustomerWorkOrder = (
  customerWorkOrder: typeof customerWorkOrders.$inferSelect
): CustomerWorkOrder => ({
  id: customerWorkOrder.id,
  customerId: customerWorkOrder.customerId,
  workOrderId: customerWorkOrder.workOrderId,
  createdAt: customerWorkOrder.createdAt.toISOString()
})

export const CustomerWorkOrderStorage = {
  findAll: async (): Promise<ReadonlyArray<CustomerWorkOrder>> => {
    const rows = await db
      .select()
      .from(customerWorkOrders)
      .orderBy(customerWorkOrders.id)

    return rows.map(toCustomerWorkOrder)
  },

  findById: async (id: string): Promise<CustomerWorkOrder | undefined> => {
    const [customerWorkOrder] = await db
      .select()
      .from(customerWorkOrders)
      .where(eq(customerWorkOrders.id, id))
      .limit(1)

    return customerWorkOrder === undefined
      ? undefined
      : toCustomerWorkOrder(customerWorkOrder)
  },

  create: async (
    input: CreateCustomerWorkOrderInput
  ): Promise<CustomerWorkOrder> => {
    const [customerWorkOrder] = await db
      .insert(customerWorkOrders)
      .values({
        customerId: input.customerId,
        workOrderId: input.workOrderId
      })
      .returning()

    return toCustomerWorkOrder(customerWorkOrder)
  },

  updateById: async (
    id: string,
    input: UpdateCustomerWorkOrderInput
  ): Promise<CustomerWorkOrder | undefined> => {
    const [customerWorkOrder] = await db
      .update(customerWorkOrders)
      .set({
        customerId: input.customerId,
        workOrderId: input.workOrderId,
        updatedAt: new Date()
      })
      .where(eq(customerWorkOrders.id, id))
      .returning()

    return customerWorkOrder === undefined
      ? undefined
      : toCustomerWorkOrder(customerWorkOrder)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [customerWorkOrder] = await db
      .delete(customerWorkOrders)
      .where(eq(customerWorkOrders.id, id))
      .returning({ id: customerWorkOrders.id })

    return customerWorkOrder !== undefined
  }
}
