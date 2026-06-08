import type { CreateRoleInput, Role, UpdateRoleInput } from "./role.model.js"
import { RoleStorage } from "./role.storage.js"

export const RoleService = {
  findAll: (): Promise<ReadonlyArray<Role>> => RoleStorage.findAll(),

  findById: (id: string): Promise<Role | undefined> => RoleStorage.findById(id),

  create: (input: CreateRoleInput): Promise<Role> => RoleStorage.create(input),

  updateById: (
    id: string,
    input: UpdateRoleInput
  ): Promise<Role | undefined> => RoleStorage.updateById(id, input),

  deleteById: (id: string): Promise<boolean> => RoleStorage.deleteById(id)
}
