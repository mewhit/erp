import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { workOrders } from "../db/schema.js"
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  WorkOrder
} from "./work-order.model.js"

const toWorkOrder = (
  workOrder: typeof workOrders.$inferSelect
): WorkOrder => ({
  id: workOrder.id,
  organizationId: workOrder.organizationId,
  customerId: workOrder.customerId,
  number: workOrder.number,
  title: workOrder.title,
  description: workOrder.description ?? "",
  status: workOrder.status,
  createdAt: workOrder.createdAt.toISOString()
})

export const WorkOrderStorage = {
  findAll: async (): Promise<ReadonlyArray<WorkOrder>> => {
    const rows = await db
      .select()
      .from(workOrders)
      .where(isNull(workOrders.deletedAt))
      .orderBy(workOrders.id)

    return rows.map(toWorkOrder)
  },

  findById: async (id: string): Promise<WorkOrder | undefined> => {
    const [workOrder] = await db
      .select()
      .from(workOrders)
      .where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt)))
      .limit(1)

    return workOrder === undefined ? undefined : toWorkOrder(workOrder)
  },

  create: async (input: CreateWorkOrderInput): Promise<WorkOrder> => {
    const [workOrder] = await db
      .insert(workOrders)
      .values({
        organizationId: input.organizationId,
        customerId: input.customerId,
        number: input.number,
        title: input.title,
        description: input.description,
        status: input.status
      })
      .returning()

    return toWorkOrder(workOrder)
  },

  updateById: async (
    id: string,
    input: UpdateWorkOrderInput
  ): Promise<WorkOrder | undefined> => {
    const [workOrder] = await db
      .update(workOrders)
      .set({
        organizationId: input.organizationId,
        customerId: input.customerId,
        number: input.number,
        title: input.title,
        description: input.description,
        status: input.status,
        updatedAt: new Date()
      })
      .where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt)))
      .returning()

    return workOrder === undefined ? undefined : toWorkOrder(workOrder)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [workOrder] = await db
      .update(workOrders)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(workOrders.id, id), isNull(workOrders.deletedAt)))
      .returning({ id: workOrders.id })

    return workOrder !== undefined
  }
}
