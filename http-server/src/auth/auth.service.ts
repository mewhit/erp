import { UserStorage } from "../user/user.storage.js"
import type { AuthSession, LoginInput } from "./auth.model.js"
import { AuthStorage } from "./auth.storage.js"
import { verifyPassword } from "./password.js"
import { createAuthToken, verifyAuthToken } from "./token.js"

export const AuthService = {
  login: async (input: LoginInput): Promise<AuthSession | undefined> => {
    const user = await AuthStorage.findByEmailWithPassword(input.email)

    if (
      user === undefined ||
      !(await verifyPassword(input.password, user.passwordHash))
    ) {
      return undefined
    }

    const { passwordHash: _passwordHash, ...safeUser } = user

    return {
      token: createAuthToken(safeUser),
      user: safeUser
    }
  },

  findUserByToken: async (token: string) => {
    const payload = verifyAuthToken(token)

    if (payload === undefined) {
      return undefined
    }

    return UserStorage.findById(payload.userId)
  }
}
