import type {
  CreateWorkOrderItemInput,
  UpdateWorkOrderItemInput,
  WorkOrderItem
} from "./work-order-item.model.js"
import { WorkOrderItemStorage } from "./work-order-item.storage.js"

export const WorkOrderItemService = {
  findAll: (): Promise<ReadonlyArray<WorkOrderItem>> =>
    WorkOrderItemStorage.findAll(),

  findById: (id: string): Promise<WorkOrderItem | undefined> =>
    WorkOrderItemStorage.findById(id),

  create: (input: CreateWorkOrderItemInput): Promise<WorkOrderItem> =>
    WorkOrderItemStorage.create(input),

  updateById: (
    id: string,
    input: UpdateWorkOrderItemInput
  ): Promise<WorkOrderItem | undefined> =>
    WorkOrderItemStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> =>
    WorkOrderItemStorage.deleteById(id)
}
