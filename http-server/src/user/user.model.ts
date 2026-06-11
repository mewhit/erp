import { Schema } from "effect"

export const User = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.String
})

export type User = typeof User.Type

export const CreateUserInput = Schema.Struct({
  name: Schema.String,
  email: Schema.String
})

export type CreateUserInput = typeof CreateUserInput.Type
