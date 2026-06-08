import type {
  CreateOrganizationUserRoleInput,
  OrganizationUserRole,
  UpdateOrganizationUserRoleInput
} from "./organization-user-role.model.js"
import { OrganizationUserRoleStorage } from "./organization-user-role.storage.js"

export const OrganizationUserRoleService = {
  findAll: (): Promise<ReadonlyArray<OrganizationUserRole>> =>
    OrganizationUserRoleStorage.findAll(),

  findById: (id: string): Promise<OrganizationUserRole | undefined> =>
    OrganizationUserRoleStorage.findById(id),

  create: (
    input: CreateOrganizationUserRoleInput
  ): Promise<OrganizationUserRole> => OrganizationUserRoleStorage.create(input),

  updateById: (
    id: string,
    input: UpdateOrganizationUserRoleInput
  ): Promise<OrganizationUserRole | undefined> =>
    OrganizationUserRoleStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> =>
    OrganizationUserRoleStorage.deleteById(id)
}
