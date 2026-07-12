import type { PrismaClient } from "@prisma/client"

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

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
let _prisma: PrismaClient | undefined = globalForPrisma.prisma

function createPrisma(): PrismaClient {
  if (typeof window !== "undefined") {
    throw new Error("PrismaClient cannot be used in the browser")
  }
  const mod = Function('return require("@prisma/client")')() as { PrismaClient: new (opts?: unknown) => PrismaClient }
  return new mod.PrismaClient({ datasources: { db: { url: getDatabaseUrl() } } } as never)
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: keyof PrismaClient) {
    if (!_prisma) {
      _prisma = createPrisma()
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma
    }
    return _prisma[prop]
  }
})
