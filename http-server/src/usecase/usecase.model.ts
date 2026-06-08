import { Schema } from "effect"

export const AddUserUserInput = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  password: Schema.String
})

export const AddUserInput = Schema.Struct({
  user: AddUserUserInput,
  organizationId: Schema.String,
  roleId: Schema.String
})

export type AddUserInput = typeof AddUserInput.Type

export const AddUserUser = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.String
})

export type AddUserUser = typeof AddUserUser.Type

export const AddUserOrganizationUserRole = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  userId: Schema.String,
  roleId: Schema.String,
  createdAt: Schema.String
})

export type AddUserOrganizationUserRole =
  typeof AddUserOrganizationUserRole.Type

export const AddUserResult = Schema.Struct({
  user: AddUserUser,
  organizationUserRole: AddUserOrganizationUserRole
})

export type AddUserResult = typeof AddUserResult.Type
