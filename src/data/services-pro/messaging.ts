import { queryOne, queryAll, execute } from "@/lib/db"
import type { SellerMessage, AutoReply, MessageTemplate } from "@/lib/services-pro-types"

export async function getMessages(shopId: string, page = 1, limit = 20): Promise<{
  messages: SellerMessage[]; total: number; unreadCount: number
}> {
  const offset = (page - 1) * limit
  const [messages, totalRow, unreadRow] = await Promise.all([
    queryAll<any>(
      `SELECT sm.*, u.name as userName FROM SellerMessage sm
       JOIN User u ON u.id = sm.userId
       WHERE sm.shopId = ? ORDER BY sm.createdAt DESC LIMIT ? OFFSET ?`,
      [shopId, limit, offset]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM SellerMessage WHERE shopId = ?",
      [shopId]
    ),
    queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM SellerMessage WHERE shopId = ? AND isRead = 0 AND senderRole = 'client'",
      [shopId]
    ),
  ])

  for (const msg of messages) {
    msg.replies = await queryAll<any>(
      "SELECT * FROM SellerMessageReply WHERE messageId = ? ORDER BY createdAt ASC",
      [msg.id]
    )
  }

  return {
    messages: messages as SellerMessage[],
    total: totalRow?.count ?? 0,
    unreadCount: unreadRow?.count ?? 0,
  }
}

export async function sendMessage(shopId: string, data: {
  userId: number; orderId?: string; subject: string; message: string
}): Promise<SellerMessage | null> {
  const id = `MSG-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  await execute(
    `INSERT INTO SellerMessage (id, shopId, userId, orderId, subject, message, senderRole)
     VALUES (?, ?, ?, ?, ?, ?, 'seller')`,
    [id, shopId, data.userId, data.orderId || null, data.subject, data.message]
  )
  return queryOne<SellerMessage>("SELECT * FROM SellerMessage WHERE id = ?", [id])
}

export async function replyToMessage(messageId: string, message: string): Promise<void> {
  await execute(
    `INSERT INTO SellerMessageReply (messageId, senderRole, message) VALUES (?, 'seller', ?)`,
    [messageId, message]
  )
  await execute(
    "UPDATE SellerMessage SET isRead = 1, readAt = NOW() WHERE id = ?",
    [messageId]
  )
}

export async function markMessageRead(id: string): Promise<void> {
  await execute(
    "UPDATE SellerMessage SET isRead = 1, readAt = NOW() WHERE id = ?",
    [id]
  )
}

export async function getAutoReplies(shopId: string): Promise<AutoReply[]> {
  return queryAll<AutoReply>(
    "SELECT * FROM AutoReply WHERE shopId = ? ORDER BY createdAt DESC",
    [shopId]
  )
}

export async function createAutoReply(shopId: string, data: {
  keyword: string; replySubject?: string; replyMessage: string; matchType?: string
}): Promise<void> {
  await execute(
    `INSERT INTO AutoReply (shopId, keyword, replySubject, replyMessage, matchType)
     VALUES (?, ?, ?, ?, ?)`,
    [shopId, data.keyword, data.replySubject || null, data.replyMessage, data.matchType || 'contains']
  )
}

export async function deleteAutoReply(id: number): Promise<void> {
  await execute("DELETE FROM AutoReply WHERE id = ?", [id])
}

export async function getMessageTemplates(shopId: string): Promise<MessageTemplate[]> {
  return queryAll<MessageTemplate>(
    "SELECT * FROM MessageTemplate WHERE shopId = ? ORDER BY category ASC, name ASC",
    [shopId]
  )
}

export async function createMessageTemplate(shopId: string, data: {
  name: string; subject: string; body: string; category?: string
}): Promise<void> {
  await execute(
    `INSERT INTO MessageTemplate (shopId, name, subject, body, category) VALUES (?, ?, ?, ?, ?)`,
    [shopId, data.name, data.subject, data.body, data.category || 'general']
  )
}

export async function deleteMessageTemplate(id: number): Promise<void> {
  await execute("DELETE FROM MessageTemplate WHERE id = ?", [id])
}
