import {
  type AuthSession,
  type CreateUserAuthenticationInput,
  type LoginInput
} from "./auth.model.js"
import { AuthStorage } from "./auth.storage.js"
import { hashPassword, verifyPassword } from "./password.js"
import { createAuthToken, verifyAuthToken } from "./token.js"

export const AuthService = {
  login: async (input: LoginInput): Promise<AuthSession | undefined> => {
    const authentication = await AuthStorage.findByEmailWithPassword(input.email)

    if (
      authentication === undefined ||
      !(await verifyPassword(input.password, authentication.passwordHash))
    ) {
      return undefined
    }

    return {
      token: createAuthToken(authentication.userId)
    }
  },

  getUserIdByToken: (token: string): string | undefined =>
    verifyAuthToken(token)?.userId,

  createForUser: async (
    userId: string,
    input: CreateUserAuthenticationInput
  ): Promise<boolean> => {
    await AuthStorage.createForUser({
      userId,
      email: input.email,
      passwordHash: await hashPassword(input.password)
    })

    return true
  },

  setPasswordForUser: async (
    userId: string,
    input: CreateUserAuthenticationInput
  ): Promise<boolean> => {
    return AuthStorage.setPasswordForUser({
      userId,
      email: input.email,
      passwordHash: await hashPassword(input.password)
    })
  }
}
