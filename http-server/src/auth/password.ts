import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const pbkdf2Async = promisify(pbkdf2)

const algorithm = "pbkdf2_sha256"
const digest = "sha256"
const iterations = 310000
const keyLength = 32

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("base64url")
  const hash = await pbkdf2Async(password, salt, iterations, keyLength, digest)

  return `${algorithm}$${iterations}$${salt}$${hash.toString("base64url")}`
}

export const verifyPassword = async (
  password: string,
  encoded: string
): Promise<boolean> => {
  const [storedAlgorithm, storedIterations, salt, storedHash] = encoded.split("$")

  if (
    storedAlgorithm !== algorithm ||
    storedIterations === undefined ||
    salt === undefined ||
    storedHash === undefined
  ) {
    return false
  }

  const parsedIterations = Number(storedIterations)

  if (!Number.isInteger(parsedIterations) || parsedIterations <= 0) {
    return false
  }

  const expected = Buffer.from(storedHash, "base64url")
  const actual = await pbkdf2Async(
    password,
    salt,
    parsedIterations,
    expected.length,
    digest
  )

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
