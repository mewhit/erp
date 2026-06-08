import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  WorkOrder
} from "./work-order.model.js"
import { WorkOrderStorage } from "./work-order.storage.js"

export const WorkOrderService = {
  findAll: (): Promise<ReadonlyArray<WorkOrder>> => WorkOrderStorage.findAll(),

  findById: (id: string): Promise<WorkOrder | undefined> =>
    WorkOrderStorage.findById(id),

  create: (input: CreateWorkOrderInput): Promise<WorkOrder> =>
    WorkOrderStorage.create(input),

  updateById: (
    id: string,
    input: UpdateWorkOrderInput
  ): Promise<WorkOrder | undefined> => WorkOrderStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> => WorkOrderStorage.deleteById(id)
}
