import type { CreateUserInput, User } from "./user.model.js"
import { UserStorage } from "./user.storage.js"
import { AuthStorage } from "../auth/auth.storage.js"
import { hashPassword } from "../auth/password.js"

export const UserService = {
  findAll: (): Promise<ReadonlyArray<User>> => UserStorage.findAll(),

  findById: (id: string): Promise<User | undefined> =>
    UserStorage.findById(id),

  create: async (input: CreateUserInput): Promise<User> => {
    const user = await UserStorage.create(input)

    await AuthStorage.createForUser({
      userId: user.id,
      passwordHash: await hashPassword(input.password)
    })

    return user
  },

  deleteById: (id: string): Promise<boolean> => UserStorage.deleteById(id)
}
