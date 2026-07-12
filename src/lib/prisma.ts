import "server-only"
import type { PrismaClient } from "@prisma/client"

type PrismaInstance = PrismaClient

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL
  if (envUrl && !envUrl.includes("placeholder") && !envUrl.includes("user:pass@")) return envUrl
  const host = process.env.DB_HOST || "127.0.0.1"
  const port = process.env.DB_PORT || "3306"
  const user = process.env.DB_USER || "u658795094_axel"
  const pass = process.env.DB_PASSWORD || ""
  const name = process.env.DB_NAME || "u658795094_axel"
  return `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}`
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaInstance | undefined }
let _prisma: PrismaInstance | undefined = globalForPrisma.prisma

function createPrisma(): PrismaInstance {
  if (typeof window !== "undefined") {
    throw new Error("PrismaClient cannot be used in the browser")
  }
  const path = "@" + "prisma/client"
  const mod = require(path) as { PrismaClient: new (opts?: unknown) => PrismaInstance }
  return new mod.PrismaClient({ datasources: { db: { url: getDatabaseUrl() } } } as never)
}

export const prisma = new Proxy({} as PrismaInstance, {
  get(_, prop: string | symbol) {
    if (!_prisma) {
      _prisma = createPrisma()
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma
    }
    if (typeof prop === "string") return (_prisma as unknown as Record<string, unknown | undefined>)[prop]
    return undefined
  }
})
