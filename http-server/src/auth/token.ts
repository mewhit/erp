import { createHmac, timingSafeEqual } from "node:crypto"

export type AuthTokenPayload = {
  sub: string
  userId: string
  exp: number
}

const secret =
  process.env.AUTH_TOKEN_SECRET ?? "development-auth-token-secret-change-me"

const tokenTtlSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 86400)

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString("base64url")

const sign = (header: string, payload: string): string =>
  createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url")

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export const createAuthToken = (userId: string): string => {
  const header = encode({
    alg: "HS256",
    typ: "JWT"
  })
  const payload = encode({
    sub: userId,
    userId,
    exp: Math.floor(Date.now() / 1000) + tokenTtlSeconds
  } satisfies AuthTokenPayload)

  return `${header}.${payload}.${sign(header, payload)}`
}

export const verifyAuthToken = (token: string): AuthTokenPayload | undefined => {
  const [header, payload, signature] = token.split(".")

  if (header === undefined || payload === undefined || signature === undefined) {
    return undefined
  }

  if (!safeEqual(sign(header, payload), signature)) {
    return undefined
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<AuthTokenPayload>

    const userId = parsed.userId ?? parsed.sub

    if (
      typeof parsed.sub !== "string" ||
      typeof userId !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      return undefined
    }

    return {
      sub: parsed.sub,
      userId,
      exp: parsed.exp
    }
  } catch {
    return undefined
  }
}
