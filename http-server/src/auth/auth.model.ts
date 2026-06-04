import { Schema } from "effect"
import { User } from "../user/user.model.js"

export const LoginInput = Schema.Struct({
  email: Schema.String,
  password: Schema.String
})

export type LoginInput = typeof LoginInput.Type

export const AuthSession = Schema.Struct({
  token: Schema.String,
  user: User
})

export type AuthSession = typeof AuthSession.Type
