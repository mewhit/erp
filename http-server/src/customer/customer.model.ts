import { Schema } from "effect"

export const Customer = Schema.Struct({
  id: Schema.String,
  firstName: Schema.String,
  lastName: Schema.String,
  email: Schema.String,
  phone: Schema.String,
  isActive: Schema.Boolean,
  createdAt: Schema.String
})

export type Customer = typeof Customer.Type

export const CreateCustomerInput = Schema.Struct({
  firstName: Schema.String,
  lastName: Schema.String,
  email: Schema.String,
  phone: Schema.String
})

export type CreateCustomerInput = typeof CreateCustomerInput.Type

export const UpdateCustomerInput = Schema.Struct({
  firstName: Schema.String,
  lastName: Schema.String,
  email: Schema.String,
  phone: Schema.String,
  isActive: Schema.Boolean
})

export type UpdateCustomerInput = typeof UpdateCustomerInput.Type
