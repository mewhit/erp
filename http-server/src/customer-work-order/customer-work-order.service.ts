import type {
  CreateCustomerWorkOrderInput,
  CustomerWorkOrder,
  UpdateCustomerWorkOrderInput
} from "./customer-work-order.model.js"
import { CustomerWorkOrderStorage } from "./customer-work-order.storage.js"

export const CustomerWorkOrderService = {
  findAll: (): Promise<ReadonlyArray<CustomerWorkOrder>> =>
    CustomerWorkOrderStorage.findAll(),

  findById: (id: string): Promise<CustomerWorkOrder | undefined> =>
    CustomerWorkOrderStorage.findById(id),

  create: (
    input: CreateCustomerWorkOrderInput
  ): Promise<CustomerWorkOrder> => CustomerWorkOrderStorage.create(input),

  updateById: (
    id: string,
    input: UpdateCustomerWorkOrderInput
  ): Promise<CustomerWorkOrder | undefined> =>
    CustomerWorkOrderStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> =>
    CustomerWorkOrderStorage.deleteById(id)
}
