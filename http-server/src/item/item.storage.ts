import { and, eq, isNull } from "drizzle-orm"
import { db } from "../db/client.js"
import { items } from "../db/schema.js"
import type { CreateItemInput, Item, UpdateItemInput } from "./item.model.js"

const toItem = (item: typeof items.$inferSelect): Item => ({
  id: item.id,
  name: item.name,
  sku: item.sku,
  description: item.description ?? "",
  unitPriceCents: item.unitPriceCents,
  quantity: item.quantity,
  isActive: item.isActive,
  createdAt: item.createdAt.toISOString()
})

export const ItemStorage = {
  findAll: async (): Promise<ReadonlyArray<Item>> => {
    const rows = await db
      .select()
      .from(items)
      .where(isNull(items.deletedAt))
      .orderBy(items.id)

    return rows.map(toItem)
  },

  findById: async (id: string): Promise<Item | undefined> => {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, id), isNull(items.deletedAt)))
      .limit(1)

    return item === undefined ? undefined : toItem(item)
  },

  create: async (input: CreateItemInput): Promise<Item> => {
    const [item] = await db
      .insert(items)
      .values({
        name: input.name,
        sku: input.sku,
        description: input.description,
        unitPriceCents: input.unitPriceCents,
        quantity: input.quantity
      })
      .returning()

    return toItem(item)
  },

  updateById: async (
    id: string,
    input: UpdateItemInput
  ): Promise<Item | undefined> => {
    const [item] = await db
      .update(items)
      .set({
        name: input.name,
        sku: input.sku,
        description: input.description,
        unitPriceCents: input.unitPriceCents,
        quantity: input.quantity,
        isActive: input.isActive,
        updatedAt: new Date()
      })
      .where(and(eq(items.id, id), isNull(items.deletedAt)))
      .returning()

    return item === undefined ? undefined : toItem(item)
  },

  deleteById: async (id: string): Promise<boolean> => {
    const [item] = await db
      .update(items)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(items.id, id), isNull(items.deletedAt)))
      .returning({ id: items.id })

    return item !== undefined
  }
}
