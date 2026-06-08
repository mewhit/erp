import { Schema } from "effect"

export const OrganizationUserRole = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String,
  createdAt: Schema.String
})

export type OrganizationUserRole = typeof OrganizationUserRole.Type

export const CreateOrganizationUserRoleInput = Schema.Struct({
  organizationId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String
})

export type CreateOrganizationUserRoleInput =
  typeof CreateOrganizationUserRoleInput.Type

export const UpdateOrganizationUserRoleInput = Schema.Struct({
  organizationId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String
})

export type UpdateOrganizationUserRoleInput =
  typeof UpdateOrganizationUserRoleInput.Type
