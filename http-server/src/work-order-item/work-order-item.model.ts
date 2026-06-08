import { Schema } from "effect"

export const WorkOrderItem = Schema.Struct({
  id: Schema.String,
  workOrderId: Schema.String,
  itemId: Schema.String,
  description: Schema.String,
  quantity: Schema.Number,
  unitPriceCents: Schema.Number,
  createdAt: Schema.String
})

export type WorkOrderItem = typeof WorkOrderItem.Type

export const CreateWorkOrderItemInput = Schema.Struct({
  workOrderId: Schema.String,
  itemId: Schema.String,
  description: Schema.String,
  quantity: Schema.Number,
  unitPriceCents: Schema.Number
})

export type CreateWorkOrderItemInput = typeof CreateWorkOrderItemInput.Type

export const UpdateWorkOrderItemInput = Schema.Struct({
  workOrderId: Schema.String,
  itemId: Schema.String,
  description: Schema.String,
  quantity: Schema.Number,
  unitPriceCents: Schema.Number
})

export type UpdateWorkOrderItemInput = typeof UpdateWorkOrderItemInput.Type
