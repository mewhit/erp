import { Schema } from "effect"

export const CustomerWorkOrder = Schema.Struct({
  id: Schema.String,
  customerId: Schema.String,
  workOrderId: Schema.String,
  createdAt: Schema.String
})

export type CustomerWorkOrder = typeof CustomerWorkOrder.Type

export const CreateCustomerWorkOrderInput = Schema.Struct({
  customerId: Schema.String,
  workOrderId: Schema.String
})

export type CreateCustomerWorkOrderInput =
  typeof CreateCustomerWorkOrderInput.Type

export const UpdateCustomerWorkOrderInput = Schema.Struct({
  customerId: Schema.String,
  workOrderId: Schema.String
})

export type UpdateCustomerWorkOrderInput =
  typeof UpdateCustomerWorkOrderInput.Type
