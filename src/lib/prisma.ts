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

const globalForPrisma = globalThis as unknown as { prisma: unknown }
let _prisma: unknown = globalForPrisma.prisma

export const prisma = new Proxy({} as Record<string, unknown>, {
  get(_, prop: string) {
    if (!_prisma) {
      if (typeof window !== "undefined") {
        throw new Error("PrismaClient cannot be used in the browser")
      }
      const pkg = "@prisma/client"
      const mod = eval('require("' + pkg + '")') as { PrismaClient: new (opts?: unknown) => unknown }
      _prisma = new mod.PrismaClient({ datasources: { db: { url: getDatabaseUrl() } } } as never)
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = _prisma
    }
    return (_prisma as Record<string, unknown>)[prop]
  }
})
