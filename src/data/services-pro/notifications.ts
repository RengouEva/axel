import { queryOne, queryAll, execute } from "@/lib/db"
import type { SellerNotification } from "@/lib/services-pro-types"

export async function getNotifications(shopId: string, page = 1, limit = 20): Promise<{
  notifications: SellerNotification[]; total: number; unreadCount: number
}> {
  const offset = (page - 1) * limit
  const [notifications, totalRow, unreadRow] = await Promise.all([
    queryAll<SellerNotification>(
      "SELECT * FROM SellerNotification WHERE shopId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
      [shopId, limit, offset]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM SellerNotification WHERE shopId = ?",
      [shopId]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM SellerNotification WHERE shopId = ? AND isRead = 0",
      [shopId]
    ),
  ])

  return {
    notifications: notifications.map((n: any) => ({
      ...n,
      data: n.data ? (typeof n.data === 'string' ? JSON.parse(n.data) : n.data) : null,
    })),
    total: totalRow?.count ?? 0,
    unreadCount: unreadRow?.count ?? 0,
  }
}

export async function createNotification(shopId: string, data: {
  type: string; title: string; message?: string; data?: any
}): Promise<void> {
  const id = `NOTIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  await execute(
    "INSERT INTO SellerNotification (id, shopId, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)",
    [id, shopId, data.type, data.title, data.message || null,
     data.data ? JSON.stringify(data.data) : null]
  )
}

export async function markNotificationRead(id: string): Promise<void> {
  await execute(
    "UPDATE SellerNotification SET isRead = 1, readAt = NOW() WHERE id = ?",
    [id]
  )
}

export async function markAllNotificationsRead(shopId: string): Promise<void> {
  await execute(
    "UPDATE SellerNotification SET isRead = 1, readAt = NOW() WHERE shopId = ? AND isRead = 0",
    [shopId]
  )
}

export async function deleteNotification(id: string): Promise<void> {
  await execute("DELETE FROM SellerNotification WHERE id = ?", [id])
}

export async function getUnreadCount(shopId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM SellerNotification WHERE shopId = ? AND isRead = 0",
    [shopId]
  )
  return row?.count ?? 0
}

export async function checkStockAlertsAndNotify(): Promise<void> {
  const alerts = await queryAll<any>(
    `SELECT sa.*, p.name as productName, p.shopId,
            COALESCE((SELECT SUM(quantity) FROM ProductStock WHERE productId = p.id), 0) as currentStock
     FROM StockAlert sa
     JOIN Product p ON p.id = sa.productId
     WHERE sa.notified = 0 AND sa.threshold > COALESCE((SELECT SUM(quantity) FROM ProductStock WHERE productId = p.id), 0)`
  )

  for (const alert of alerts) {
    await createNotification(alert.shopId, {
      type: 'low_stock',
      title: `Stock faible : ${alert.productName}`,
      message: `Le stock de "${alert.productName}" est descendu à ${alert.currentStock} unités (seuil : ${alert.threshold}).`,
      data: { productId: alert.productId, currentStock: alert.currentStock, threshold: alert.threshold },
    })
    await execute("UPDATE StockAlert SET notified = 1, lastNotifiedAt = NOW() WHERE id = ?", [alert.id])
  }
}
