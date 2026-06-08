import type { CreateItemInput, Item, UpdateItemInput } from "./item.model.js"
import { ItemStorage } from "./item.storage.js"

export const ItemService = {
  findAll: (): Promise<ReadonlyArray<Item>> => ItemStorage.findAll(),

  findById: (id: string): Promise<Item | undefined> => ItemStorage.findById(id),

  create: (input: CreateItemInput): Promise<Item> => ItemStorage.create(input),

  updateById: (
    id: string,
    input: UpdateItemInput
  ): Promise<Item | undefined> => ItemStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> => ItemStorage.deleteById(id)
}
