import { Schema } from "effect"

export const Role = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  code: Schema.String,
  isActive: Schema.Boolean,
  createdAt: Schema.String
})

export type Role = typeof Role.Type

export const CreateRoleInput = Schema.Struct({
  name: Schema.String,
  code: Schema.String
})

export type CreateRoleInput = typeof CreateRoleInput.Type

export const UpdateRoleInput = Schema.Struct({
  name: Schema.String,
  code: Schema.String,
  isActive: Schema.Boolean
})

export type UpdateRoleInput = typeof UpdateRoleInput.Type
