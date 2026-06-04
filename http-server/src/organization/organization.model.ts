import { Schema } from "effect"

export const Organization = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  code: Schema.String,
  createdAt: Schema.String
})

export type Organization = typeof Organization.Type

export const CreateOrganizationInput = Schema.Struct({
  name: Schema.String,
  code: Schema.String
})

export type CreateOrganizationInput = typeof CreateOrganizationInput.Type
