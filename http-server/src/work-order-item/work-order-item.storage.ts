import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { workOrderItems } from "../db/schema.js"
import type {
  CreateWorkOrderItemInput,
  UpdateWorkOrderItemInput,
  WorkOrderItem
} from "./work-order-item.model.js"

const toWorkOrderItem = (
  workOrderItem: typeof workOrderItems.$inferSelect
): WorkOrderItem => ({
  id: workOrderItem.id,
  workOrderId: workOrderItem.workOrderId,
  itemId: workOrderItem.itemId,
  description: workOrderItem.description ?? "",
  quantity: workOrderItem.quantity,
  unitPriceCents: workOrderItem.unitPriceCents,
  createdAt: workOrderItem.createdAt.toISOString()
})

export const WorkOrderItemStorage = {
  findAll: async (): Promise<ReadonlyArray<WorkOrderItem>> => {
    const rows = await db
      .select()
      .from(workOrderItems)
      .where(isNull(workOrderItems.deletedAt))
      .orderBy(workOrderItems.id)

    return rows.map(toWorkOrderItem)
  },

  findById: async (id: string): Promise<WorkOrderItem | undefined> => {
    const [workOrderItem] = await db
      .select()
      .from(workOrderItems)
      .where(and(eq(workOrderItems.id, id), isNull(workOrderItems.deletedAt)))
      .limit(1)

    return workOrderItem === undefined
      ? undefined
      : toWorkOrderItem(workOrderItem)
  },

  create: async (
    input: CreateWorkOrderItemInput
  ): Promise<WorkOrderItem> => {
    const [workOrderItem] = await db
      .insert(workOrderItems)
      .values({
        workOrderId: input.workOrderId,
        itemId: input.itemId,
        description: input.description,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents
      })
      .returning()

    return toWorkOrderItem(workOrderItem)
  },

  updateById: async (
    id: string,
    input: UpdateWorkOrderItemInput
  ): Promise<WorkOrderItem | undefined> => {
    const [workOrderItem] = await db
      .update(workOrderItems)
      .set({
        workOrderId: input.workOrderId,
        itemId: input.itemId,
        description: input.description,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
        updatedAt: new Date()
      })
      .where(and(eq(workOrderItems.id, id), isNull(workOrderItems.deletedAt)))
      .returning()

    return workOrderItem === undefined
      ? undefined
      : toWorkOrderItem(workOrderItem)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [workOrderItem] = await db
      .update(workOrderItems)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(workOrderItems.id, id), isNull(workOrderItems.deletedAt)))
      .returning({ id: workOrderItems.id })

    return workOrderItem !== undefined
  }
}
