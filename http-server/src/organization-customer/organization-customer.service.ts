import type {
  CreateOrganizationCustomerInput,
  OrganizationCustomer,
  UpdateOrganizationCustomerInput
} from "./organization-customer.model.js"
import { OrganizationCustomerStorage } from "./organization-customer.storage.js"

export const OrganizationCustomerService = {
  findAll: (): Promise<ReadonlyArray<OrganizationCustomer>> =>
    OrganizationCustomerStorage.findAll(),

  findById: (id: string): Promise<OrganizationCustomer | undefined> =>
    OrganizationCustomerStorage.findById(id),

  create: (
    input: CreateOrganizationCustomerInput
  ): Promise<OrganizationCustomer> => OrganizationCustomerStorage.create(input),

  updateById: (
    id: string,
    input: UpdateOrganizationCustomerInput
  ): Promise<OrganizationCustomer | undefined> =>
    OrganizationCustomerStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> =>
    OrganizationCustomerStorage.deleteById(id)
}
