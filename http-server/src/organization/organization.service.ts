import type {
  CreateOrganizationInput,
  Organization
} from "./organization.model.js"
import { OrganizationStorage } from "./organization.storage.js"

export const OrganizationService = {
  findAll: (): Promise<ReadonlyArray<Organization>> =>
    OrganizationStorage.findAll(),

  findById: (id: string): Promise<Organization | undefined> =>
    OrganizationStorage.findById(id),

  create: (input: CreateOrganizationInput): Promise<Organization> =>
    OrganizationStorage.create(input),

  deleteById: (id: string): Promise<boolean> =>
    OrganizationStorage.deleteById(id)
}
