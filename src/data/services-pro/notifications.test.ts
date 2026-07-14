import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getUnreadCount,
} from "./notifications"

const mockQueryOne = vi.fn()
const mockQueryAll = vi.fn()
const mockExecute = vi.fn()

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryAll: (...args: unknown[]) => mockQueryAll(...args),
  execute: (...args: unknown[]) => mockExecute(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getNotifications", () => {
  it("returns paginated notifications with total and unread count", async () => {
    const rawNotifications = [
      { id: "N1", shopId: "shop1", type: "new_order", title: "New Order #123", message: "You have a new order", data: null, isRead: false, createdAt: "2024-01-02" },
      { id: "N2", shopId: "shop1", type: "low_stock", title: "Low Stock Alert", message: null, data: '{"productId":5,"stock":2}', isRead: false, createdAt: "2024-01-01" },
    ]
    mockQueryAll.mockResolvedValue(rawNotifications)
    mockQueryOne
      .mockResolvedValueOnce({ count: 5 })
      .mockResolvedValueOnce({ count: 2 })

    const result = await getNotifications("shop1", 1, 10)

    expect(result.notifications).toHaveLength(2)
    expect(result.total).toBe(5)
    expect(result.unreadCount).toBe(2)
    expect(result.notifications[0].data).toBeNull()
    expect(result.notifications[1].data).toEqual({ productId: 5, stock: 2 })
    expect(mockQueryAll).toHaveBeenCalledWith(
      "SELECT * FROM SellerNotification WHERE shopId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
      ["shop1", 10, 0]
    )
  })

  it("handles data field that is already an object (not a JSON string)", async () => {
    const dataObj = { custom: true }
    mockQueryAll.mockResolvedValue([
      { id: "N3", shopId: "shop1", type: "system", title: "Test", message: null, data: dataObj, isRead: true, createdAt: "2024-01-03" },
    ])
    mockQueryOne
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })

    const result = await getNotifications("shop1")

    expect(result.notifications[0].data).toEqual({ custom: true })
  })

  it("returns zero total and unread count when no notifications exist", async () => {
    mockQueryAll.mockResolvedValue([])
    mockQueryOne
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 })

    const result = await getNotifications("empty-shop")

    expect(result.notifications).toEqual([])
    expect(result.total).toBe(0)
    expect(result.unreadCount).toBe(0)
  })
})

describe("createNotification", () => {
  it("inserts a notification with all fields and JSON stringifies data", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await createNotification("shop1", {
      type: "new_order",
      title: "New Order #123",
      message: "You received a new order",
      data: { orderId: "ORD-123", amount: 49.99 },
    })

    expect(mockExecute).toHaveBeenCalledTimes(1)
    const sql = mockExecute.mock.calls[0][0]
    const params = mockExecute.mock.calls[0][1]
    expect(sql).toBe(
      "INSERT INTO SellerNotification (id, shopId, type, title, message, data) VALUES (?, ?, ?, ?, ?, ?)"
    )
    expect(params[0]).toMatch(/^NOTIF-/)
    expect(params[1]).toBe("shop1")
    expect(params[2]).toBe("new_order")
    expect(params[3]).toBe("New Order #123")
    expect(params[4]).toBe("You received a new order")
    expect(params[5]).toBe(JSON.stringify({ orderId: "ORD-123", amount: 49.99 }))
  })

  it("inserts a notification without optional fields", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await createNotification("shop1", { type: "system", title: "System Update" })

    const params = mockExecute.mock.calls[0][1]
    expect(params[0]).toMatch(/^NOTIF-/)
    expect(params[4]).toBeNull()
    expect(params[5]).toBeNull()
  })
})

describe("markNotificationRead", () => {
  it("updates the notification isRead to true", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await markNotificationRead("NOTIF-abc123")

    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE SellerNotification SET isRead = 1, readAt = NOW() WHERE id = ?",
      ["NOTIF-abc123"]
    )
  })
})

describe("markAllNotificationsRead", () => {
  it("marks all unread notifications as read for the given shop", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 3 })

    await markAllNotificationsRead("shop1")

    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE SellerNotification SET isRead = 1, readAt = NOW() WHERE shopId = ? AND isRead = 0",
      ["shop1"]
    )
  })
})

describe("deleteNotification", () => {
  it("deletes a notification by id", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await deleteNotification("NOTIF-abc123")

    expect(mockExecute).toHaveBeenCalledWith(
      "DELETE FROM SellerNotification WHERE id = ?",
      ["NOTIF-abc123"]
    )
  })
})

describe("getUnreadCount", () => {
  it("returns the number of unread notifications", async () => {
    mockQueryOne.mockResolvedValue({ count: 5 })

    const result = await getUnreadCount("shop1")

    expect(result).toBe(5)
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT COUNT(*) as count FROM SellerNotification WHERE shopId = ? AND isRead = 0",
      ["shop1"]
    )
  })

  it("returns 0 when there are no unread notifications", async () => {
    mockQueryOne.mockResolvedValue({ count: 0 })

    const result = await getUnreadCount("shop1")

    expect(result).toBe(0)
  })
})
