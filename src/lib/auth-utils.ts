import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error(
      "JWT_SECRET n'est pas défini. Ajoutez JWT_SECRET dans votre fichier .env"
    )
  }
  return new TextEncoder().encode(secret)
}

const TOKEN_EXPIRY = "7d"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: {
  userId: number
  email: string
  role: string
}): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer("axel-marketplace")
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<{
  userId: number
  email: string
  role: string
} | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: "axel-marketplace",
    })
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `AXEL-${timestamp}-${random}`.toUpperCase()
}

export function generateMissionId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `MISSION-${timestamp}-${random}`.toUpperCase()
}
