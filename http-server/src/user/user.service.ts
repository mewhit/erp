import type { CreateUserInput, User } from "./user.model.js"
import { UserStorage } from "./user.storage.js"

export const UserService = {
  findAll: (): Promise<ReadonlyArray<User>> => UserStorage.findAll(),

  findById: (id: string): Promise<User | undefined> =>
    UserStorage.findById(id),

  findByEmail: (email: string): Promise<User | undefined> =>
    UserStorage.findByEmail(email),

  create: (input: CreateUserInput): Promise<User> => UserStorage.create(input),

  deleteById: (id: string): Promise<boolean> => UserStorage.deleteById(id)
}
