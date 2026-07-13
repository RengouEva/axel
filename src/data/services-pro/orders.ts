import { queryOne, queryAll, execute } from "@/lib/db"
import type { ReturnRequest } from "@/lib/services-pro-types"

export async function getShopOrders(shopId: string, page = 1, limit = 20): Promise<{
  orders: any[]; total: number; page: number; totalPages: number
}> {
  const offset = (page - 1) * limit
  const [orders, totalRow] = await Promise.all([
    queryAll<any>(
      `SELECT o.*, u.name as customerName, u.email as customerEmail
       FROM \`Order\` o
       JOIN OrderItem oi ON oi.orderId = o.id
       JOIN Product p ON p.id = oi.productId
       LEFT JOIN User u ON u.id = o.userId
       WHERE p.shopId = ?
       GROUP BY o.id ORDER BY o.createdAt DESC LIMIT ? OFFSET ?`,
      [shopId, limit, offset]
    ),
    queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT o.id) as count
       FROM \`Order\` o
       JOIN OrderItem oi ON oi.orderId = o.id
       JOIN Product p ON p.id = oi.productId
       WHERE p.shopId = ?`,
      [shopId]
    ),
  ])

  const total = totalRow?.count ?? 0
  if (orders.length > 0) {
    const orderIds = orders.map((o: any) => o.id)
    const placeholders = orderIds.map(() => "?").join(",")
    const items = await queryAll<any>(
      `SELECT oi.* FROM OrderItem oi WHERE oi.orderId IN (${placeholders})`,
      orderIds
    )
    const itemsByOrder: Record<string, any[]> = {}
    for (const item of items) {
      if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
      itemsByOrder[item.orderId].push(item)
    }
    for (const order of orders) {
      order.items = itemsByOrder[order.id] || []
    }
  }

  return { orders, total, page, totalPages: Math.ceil(total / limit) }
}

export async function getReturnRequests(shopId: string): Promise<ReturnRequest[]> {
  return queryAll<ReturnRequest>(
    `SELECT rr.*, p.name as productName, u.name as userName
     FROM ReturnRequest rr
     JOIN Product p ON p.id = rr.productId
     JOIN User u ON u.id = rr.userId
     WHERE rr.shopId = ? ORDER BY rr.createdAt DESC`,
    [shopId]
  )
}

export async function createReturnRequest(data: {
  orderId: string; productId: number; shopId: string; userId: number; reason: string; documents?: string[]
}): Promise<ReturnRequest | null> {
  const id = `RET-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  await execute(
    `INSERT INTO ReturnRequest (id, orderId, productId, shopId, userId, reason, documents)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.orderId, data.productId, data.shopId, data.userId, data.reason,
     data.documents ? JSON.stringify(data.documents) : null]
  )
  return queryOne<ReturnRequest>("SELECT * FROM ReturnRequest WHERE id = ?", [id])
}

export async function updateReturnRequest(id: string, data: {
  status: string; refundAmount?: number; refundMethod?: string; notes?: string; reviewedBy: number
}): Promise<void> {
  const updates: string[] = ["status = ?", "reviewedBy = ?", "reviewedAt = NOW()"]
  const params: unknown[] = [data.status, data.reviewedBy]
  if (data.refundAmount !== undefined) { updates.push("refundAmount = ?"); params.push(data.refundAmount) }
  if (data.refundMethod !== undefined) { updates.push("refundMethod = ?"); params.push(data.refundMethod) }
  if (data.notes !== undefined) { updates.push("notes = ?"); params.push(data.notes) }
  if (data.status === 'refunded') updates.push("refundedAt = NOW()")
  params.push(id)
  await execute(`UPDATE ReturnRequest SET ${updates.join(", ")} WHERE id = ?`, params)
}

export async function getOrderForInvoice(orderId: string): Promise<any | null> {
  const order = await queryOne<any>(
    `SELECT o.*, u.name as customerName, u.email as customerEmail
     FROM \`Order\` o LEFT JOIN User u ON u.id = o.userId WHERE o.id = ?`,
    [orderId]
  )
  if (!order) return null
  order.items = await queryAll<any>(
    `SELECT oi.*, p.image as productImage FROM OrderItem oi
     LEFT JOIN Product p ON p.id = oi.productId WHERE oi.orderId = ?`,
    [orderId]
  )
  return order
}
