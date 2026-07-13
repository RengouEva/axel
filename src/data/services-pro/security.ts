import { queryOne, queryAll, execute } from "@/lib/db"
import type { SellerSecurity, LoginLog, ActionLog, TeamMember } from "@/lib/services-pro-types"
import crypto from "crypto"

export async function getSecuritySettings(shopId: string): Promise<SellerSecurity | null> {
  return queryOne<SellerSecurity>("SELECT * FROM SellerSecurity WHERE shopId = ?", [shopId])
}

export async function upsertSecuritySettings(shopId: string, data: Partial<SellerSecurity> & {
  twoFactorSecret?: string; backupCodes?: string[]
}): Promise<void> {
  const existing = await queryOne<any>("SELECT shopId FROM SellerSecurity WHERE shopId = ?", [shopId])
  if (existing) {
    const updates: string[] = []
    const params: unknown[] = []
    if (data.twoFactorEnabled !== undefined) { updates.push("twoFactorEnabled = ?"); params.push(data.twoFactorEnabled ? 1 : 0) }
    if (data.twoFactorMethod !== undefined) { updates.push("twoFactorMethod = ?"); params.push(data.twoFactorMethod) }
    if (data.twoFactorSecret !== undefined) { updates.push("twoFactorSecret = ?"); params.push(data.twoFactorSecret) }
    if (data.backupCodes !== undefined) { updates.push("backupCodes = ?"); params.push(JSON.stringify(data.backupCodes)) }
    if (data.sessionTimeout !== undefined) { updates.push("sessionTimeout = ?"); params.push(data.sessionTimeout) }
    if (data.ipWhitelist !== undefined) { updates.push("ipWhitelist = ?"); params.push(JSON.stringify(data.ipWhitelist)) }
    if (updates.length > 0) {
      params.push(shopId)
      await execute(`UPDATE SellerSecurity SET ${updates.join(", ")} WHERE shopId = ?`, params)
    }
  } else {
    await execute(
      `INSERT INTO SellerSecurity (shopId, twoFactorEnabled, twoFactorMethod, twoFactorSecret, backupCodes, sessionTimeout, ipWhitelist)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [shopId, data.twoFactorEnabled ? 1 : 0, data.twoFactorMethod || 'app',
       data.twoFactorSecret || null, data.backupCodes ? JSON.stringify(data.backupCodes) : null,
       data.sessionTimeout || 60,
       data.ipWhitelist ? JSON.stringify(data.ipWhitelist) : null]
    )
  }
}

export async function logLogin(userId: number, data: {
  ip: string; userAgent?: string; success: boolean; failReason?: string; sessionId?: string
}): Promise<void> {
  await execute(
    `INSERT INTO LoginLog (userId, ip, userAgent, success, failReason, sessionId)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, data.ip, data.userAgent || null, data.success ? 1 : 0,
     data.failReason || null, data.sessionId || null]
  )
}

export async function logAction(shopId: string | undefined, userId: number, data: {
  action: string; entityType?: string; entityId?: string; details?: any; ip?: string; userAgent?: string
}): Promise<void> {
  await execute(
    `INSERT INTO ActionLog (shopId, userId, action, entityType, entityId, details, ip, userAgent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [shopId || null, userId, data.action, data.entityType || null,
     data.entityId || null, data.details ? JSON.stringify(data.details) : null,
     data.ip || null, data.userAgent || null]
  )
}

export async function getLoginLogs(userId: number, limit = 50): Promise<LoginLog[]> {
  return queryAll<LoginLog>(
    "SELECT * FROM LoginLog WHERE userId = ? ORDER BY createdAt DESC LIMIT ?",
    [userId, limit]
  )
}

export async function getActionLogs(shopId: string, page = 1, limit = 50): Promise<{
  logs: ActionLog[]; total: number
}> {
  const offset = (page - 1) * limit
  const [logs, totalRow] = await Promise.all([
    queryAll<ActionLog>(
      `SELECT al.*, u.name as userName FROM ActionLog al
       LEFT JOIN User u ON u.id = al.userId
       WHERE al.shopId = ? ORDER BY al.createdAt DESC LIMIT ? OFFSET ?`,
      [shopId, limit, offset]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM ActionLog WHERE shopId = ?",
      [shopId]
    ),
  ])
  return { logs, total: totalRow?.count ?? 0 }
}

export async function getTeamMembers(shopId: string): Promise<TeamMember[]> {
  return queryAll<TeamMember>(
    `SELECT tm.*, u.name as userName, u.email as userEmail
     FROM TeamMember tm JOIN User u ON u.id = tm.userId
     WHERE tm.shopId = ? ORDER BY tm.createdAt ASC`,
    [shopId]
  )
}

export async function inviteTeamMember(shopId: string, invitedBy: number, data: {
  email: string; role: string; permissions?: string[]
}): Promise<{ success: boolean; error?: string }> {
  const user = await queryOne<any>("SELECT id FROM User WHERE email = ?", [data.email])
  if (!user) return { success: false, error: "Aucun utilisateur trouvé avec cet email" }

  const existing = await queryOne<any>(
    "SELECT id FROM TeamMember WHERE shopId = ? AND userId = ?",
    [shopId, user.id]
  )
  if (existing) return { success: false, error: "Cet utilisateur est déjà membre de l'équipe" }

  await execute(
    `INSERT INTO TeamMember (shopId, userId, role, permissions, status, invitedBy, invitedAt)
     VALUES (?, ?, ?, ?, 'invited', ?, NOW())`,
    [shopId, user.id, data.role,
     data.permissions ? JSON.stringify(data.permissions) : null, invitedBy]
  )
  return { success: true }
}

export async function updateTeamMemberRole(id: number, role: string, permissions?: string[]): Promise<void> {
  const updates: string[] = ["role = ?"]
  const params: unknown[] = [role]
  if (permissions !== undefined) { updates.push("permissions = ?"); params.push(JSON.stringify(permissions)) }
  params.push(id)
  await execute(`UPDATE TeamMember SET ${updates.join(", ")} WHERE id = ?`, params)
}

export async function removeTeamMember(id: number): Promise<void> {
  await execute("UPDATE TeamMember SET status = 'removed' WHERE id = ?", [id])
}
