import { Schema } from "effect"

export const Item = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  sku: Schema.String,
  description: Schema.String,
  unitPriceCents: Schema.Number,
  quantity: Schema.Number,
  isActive: Schema.Boolean,
  createdAt: Schema.String
})

export type Item = typeof Item.Type

export const CreateItemInput = Schema.Struct({
  name: Schema.String,
  sku: Schema.String,
  description: Schema.String,
  unitPriceCents: Schema.Number,
  quantity: Schema.Number
})

export type CreateItemInput = typeof CreateItemInput.Type

export const UpdateItemInput = Schema.Struct({
  name: Schema.String,
  sku: Schema.String,
  description: Schema.String,
  unitPriceCents: Schema.Number,
  quantity: Schema.Number,
  isActive: Schema.Boolean
})

export type UpdateItemInput = typeof UpdateItemInput.Type
