import mysql from "mysql2/promise"
import "server-only"

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

function parseUrl(url: string) {
  const u = new URL(url)
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
  }
}

const globalForDb = globalThis as unknown as { pool: mysql.Pool | undefined }
const config = parseUrl(getDatabaseUrl())
const pool = globalForDb.pool ?? mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
})
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool

type Params = any[] | Record<string, any>

export async function queryOne<T>(sql: string, params?: Params): Promise<T | null> {
  const [rows] = await pool.execute(sql, params as any)
  const arr = rows as T[]
  return arr.length > 0 ? arr[0] : null
}

export async function queryAll<T>(sql: string, params?: Params): Promise<T[]> {
  const [rows] = await pool.execute(sql, params as any)
  return rows as T[]
}

export async function execute(
  sql: string, params?: Params
): Promise<{ affectedRows: number; insertId?: number }> {
  const [result] = await pool.execute(sql, params as any)
  return result as { affectedRows: number; insertId?: number }
}
