import { queryOne, queryAll, execute } from "@/lib/db"
import type { ApiKey } from "@/lib/services-pro-types"
import crypto from "crypto"

export async function getApiKeys(shopId: string): Promise<ApiKey[]> {
  return queryAll<ApiKey>(
    "SELECT id, shopId, name, keyPrefix, permissions, allowedIps, rateLimit, lastUsedAt, expiresAt, isActive, createdAt FROM ApiKey WHERE shopId = ? ORDER BY createdAt DESC",
    [shopId]
  )
}

export async function createApiKey(shopId: string, data: {
  name: string; permissions: string[]; allowedIps?: string[]; rateLimit?: number; expiresAt?: string
}): Promise<{ key: ApiKey; rawKey: string } | null> {
  const rawKey = `axel_${crypto.randomBytes(32).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.substring(0, 12)

  const id = `API-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  await execute(
    `INSERT INTO ApiKey (id, shopId, name, keyHash, keyPrefix, permissions, allowedIps, rateLimit, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, shopId, data.name, keyHash, keyPrefix, JSON.stringify(data.permissions),
     data.allowedIps ? JSON.stringify(data.allowedIps) : null,
     data.rateLimit ?? 100, data.expiresAt || null]
  )
  const key = await queryOne<ApiKey>("SELECT * FROM ApiKey WHERE id = ?", [id])
  return key ? { key, rawKey } : null
}

export async function deleteApiKey(id: string): Promise<void> {
  await execute("DELETE FROM ApiKey WHERE id = ?", [id])
}

export async function verifyApiKey(rawKey: string): Promise<ApiKey | null> {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.substring(0, 12)
  const key = await queryOne<any>(
    `SELECT * FROM ApiKey WHERE keyHash = ? AND keyPrefix = ? AND isActive = 1 AND (expiresAt IS NULL OR expiresAt > NOW())`,
    [keyHash, keyPrefix]
  )
  if (key) {
    await execute("UPDATE ApiKey SET lastUsedAt = NOW() WHERE id = ?", [key.id])
    return {
      ...key,
      permissions: typeof key.permissions === 'string' ? JSON.parse(key.permissions) : key.permissions,
      allowedIps: key.allowedIps ? (typeof key.allowedIps === 'string' ? JSON.parse(key.allowedIps) : key.allowedIps) : undefined,
    }
  }
  return null
}
