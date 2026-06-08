import { Schema } from "effect"

export const WorkOrder = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  customerId: Schema.String,
  number: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: Schema.String,
  createdAt: Schema.String
})

export type WorkOrder = typeof WorkOrder.Type

export const CreateWorkOrderInput = Schema.Struct({
  organizationId: Schema.String,
  customerId: Schema.String,
  number: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: Schema.String
})

export type CreateWorkOrderInput = typeof CreateWorkOrderInput.Type

export const UpdateWorkOrderInput = Schema.Struct({
  organizationId: Schema.String,
  customerId: Schema.String,
  number: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: Schema.String
})

export type UpdateWorkOrderInput = typeof UpdateWorkOrderInput.Type
