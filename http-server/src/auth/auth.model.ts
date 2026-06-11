import { Schema } from "effect"

export const LoginInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String
})

export type LoginInput = typeof LoginInput.Type

export const CreateUserAuthenticationInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String
})

export type CreateUserAuthenticationInput =
  typeof CreateUserAuthenticationInput.Type

export const UserPasswordInput = Schema.Struct({
  password: Schema.String
})

export type UserPasswordInput = typeof UserPasswordInput.Type

export const AuthSession = Schema.Struct({
  token: Schema.String
})

export type AuthSession = typeof AuthSession.Type
