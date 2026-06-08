import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput
} from "./customer.model.js"
import { CustomerStorage } from "./customer.storage.js"

export const CustomerService = {
  findAll: (): Promise<ReadonlyArray<Customer>> => CustomerStorage.findAll(),

  findById: (id: string): Promise<Customer | undefined> =>
    CustomerStorage.findById(id),

  create: (input: CreateCustomerInput): Promise<Customer> =>
    CustomerStorage.create(input),

  updateById: (
    id: string,
    input: UpdateCustomerInput
  ): Promise<Customer | undefined> => CustomerStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> => CustomerStorage.deleteById(id)
}
