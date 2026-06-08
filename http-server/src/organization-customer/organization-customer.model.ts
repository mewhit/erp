import { Schema } from "effect"

export const OrganizationCustomer = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  customerId: Schema.String,
  createdAt: Schema.String
})

export type OrganizationCustomer = typeof OrganizationCustomer.Type

export const CreateOrganizationCustomerInput = Schema.Struct({
  organizationId: Schema.String,
  customerId: Schema.String
})

export type CreateOrganizationCustomerInput =
  typeof CreateOrganizationCustomerInput.Type

export const UpdateOrganizationCustomerInput = Schema.Struct({
  organizationId: Schema.String,
  customerId: Schema.String
})

export type UpdateOrganizationCustomerInput =
  typeof UpdateOrganizationCustomerInput.Type
