import { describe, it, expect, vi, beforeEach } from "vitest"

const mockQueryOne = vi.fn()
const mockQueryAll = vi.fn()
const mockExecute = vi.fn()

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryAll: (...args: unknown[]) => mockQueryAll(...args),
  execute: (...args: unknown[]) => mockExecute(...args),
}))

import { getShopOrders, createReturnRequest, getReturnRequests, updateReturnRequest, getOrderForInvoice } from "./orders"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getShopOrders", () => {
  it("returns paginated orders with items", async () => {
    const mockOrders = [
      { id: "ord-1", customerName: "Alice" },
      { id: "ord-2", customerName: "Bob" },
    ]
    const mockItems = [
      { id: "item-1", orderId: "ord-1" },
      { id: "item-2", orderId: "ord-1" },
      { id: "item-3", orderId: "ord-2" },
    ]

    mockQueryAll.mockReturnValueOnce(Promise.resolve(mockOrders))
    mockQueryOne.mockReturnValueOnce(Promise.resolve({ count: 2 }))
    mockQueryAll.mockReturnValueOnce(Promise.resolve(mockItems))

    const result = await getShopOrders("shop-1", 1, 20)

    expect(mockQueryAll).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("SELECT o.*, u.name as customerName, u.email as customerEmail"),
      ["shop-1", 20, 0]
    )
    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("SELECT COUNT(DISTINCT o.id) as count"),
      ["shop-1"]
    )
    expect(mockQueryAll).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("SELECT oi.* FROM OrderItem oi WHERE oi.orderId IN (?,?)"),
      ["ord-1", "ord-2"]
    )
    expect(result.orders).toHaveLength(2)
    expect(result.orders[0].items).toEqual([mockItems[0], mockItems[1]])
    expect(result.orders[1].items).toEqual([mockItems[2]])
    expect(result.total).toBe(2)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it("returns empty orders list when no orders exist", async () => {
    mockQueryAll.mockReturnValueOnce(Promise.resolve([]))
    mockQueryOne.mockReturnValueOnce(Promise.resolve({ count: 0 }))

    const result = await getShopOrders("shop-1", 1, 20)

    expect(mockQueryAll).toHaveBeenCalledTimes(1)
    expect(mockQueryOne).toHaveBeenCalledTimes(1)
    expect(result.orders).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(0)
  })

  it("calculates pagination correctly for page 3", async () => {
    mockQueryAll.mockReturnValueOnce(Promise.resolve([{ id: "ord-1" }]))
    mockQueryOne.mockReturnValueOnce(Promise.resolve({ count: 55 }))
    mockQueryAll.mockReturnValueOnce(Promise.resolve([{ id: "item-1", orderId: "ord-1" }]))

    const result = await getShopOrders("shop-1", 3, 20)

    expect(mockQueryAll).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      ["shop-1", 20, 40]
    )
    expect(result.page).toBe(3)
    expect(result.totalPages).toBe(3)
  })
})

describe("createReturnRequest", () => {
  const data = {
    orderId: "ord-1",
    productId: 42,
    shopId: "shop-1",
    userId: 1,
    reason: "defective item",
  }

  it("inserts a return request and returns it", async () => {
    const mockReturn = { id: "RET-ABC123", ...data, documents: null }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue(mockReturn)

    const result = await createReturnRequest(data)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ReturnRequest"),
      [expect.any(String), data.orderId, data.productId, data.shopId, data.userId, data.reason, null]
    )
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM ReturnRequest WHERE id = ?",
      [expect.any(String)]
    )
    expect(result).toEqual(mockReturn)
  })

  it("handles documents array", async () => {
    const dataWithDocs = { ...data, documents: ["doc1.pdf", "doc2.pdf"] }
    const mockReturn = { id: "RET-DEF456", ...dataWithDocs, documents: JSON.stringify(dataWithDocs.documents) }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue(mockReturn)

    const result = await createReturnRequest(dataWithDocs)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO ReturnRequest"),
      [expect.any(String), data.orderId, data.productId, data.shopId, data.userId, data.reason, '["doc1.pdf","doc2.pdf"]']
    )
    expect(result).toEqual(mockReturn)
  })
})

describe("getReturnRequests", () => {
  it("returns return requests for a shop", async () => {
    const mockReqs = [
      { id: "rr-1", productName: "Shoe", userName: "Alice" },
      { id: "rr-2", productName: "Bag", userName: "Bob" },
    ]
    mockQueryAll.mockResolvedValue(mockReqs)

    const result = await getReturnRequests("shop-1")

    expect(mockQueryAll).toHaveBeenCalledWith(
      expect.stringContaining("SELECT rr.*, p.name as productName, u.name as userName"),
      ["shop-1"]
    )
    expect(result).toEqual(mockReqs)
  })
})

describe("updateReturnRequest", () => {
  it("updates status and reviewer fields", async () => {
    mockExecute.mockResolvedValue(undefined)

    await updateReturnRequest("rr-1", { status: "approved", reviewedBy: 1 })

    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE ReturnRequest SET status = ?, reviewedBy = ?, reviewedAt = NOW() WHERE id = ?",
      ["approved", 1, "rr-1"]
    )
  })

  it("includes refund fields when provided", async () => {
    mockExecute.mockResolvedValue(undefined)

    await updateReturnRequest("rr-1", {
      status: "refunded",
      refundAmount: 50,
      refundMethod: "stripe",
      notes: "refund issued",
      reviewedBy: 1,
    })

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE ReturnRequest SET"),
      ["refunded", 1, 50, "stripe", "refund issued", "rr-1"]
    )
  })

  it("includes refundedAt when status is refunded", async () => {
    mockExecute.mockResolvedValue(undefined)

    await updateReturnRequest("rr-1", { status: "refunded", reviewedBy: 1 })

    const sql = mockExecute.mock.calls[0][0] as string
    expect(sql).toContain("refundedAt = NOW()")
    expect(mockExecute.mock.calls[0][1]).toEqual(["refunded", 1, "rr-1"])
  })
})

describe("getOrderForInvoice", () => {
  it("returns order with items", async () => {
    const mockOrder = { id: "ord-1", customerName: "Alice", customerEmail: "alice@test.com" }
    const mockItems = [{ id: "item-1", productImage: "img.jpg" }]

    mockQueryOne.mockResolvedValue(mockOrder)
    mockQueryAll.mockResolvedValue(mockItems)

    const result = await getOrderForInvoice("ord-1")

    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.stringContaining("FROM `Order` o LEFT JOIN User u ON u.id = o.userId WHERE o.id = ?"),
      ["ord-1"]
    )
    expect(mockQueryAll).toHaveBeenCalledWith(
      expect.stringContaining("SELECT oi.*, p.image as productImage FROM OrderItem oi"),
      ["ord-1"]
    )
    expect(result).toEqual({ ...mockOrder, items: mockItems })
  })

  it("returns null when order not found", async () => {
    mockQueryOne.mockResolvedValue(null)

    const result = await getOrderForInvoice("ord-404")

    expect(mockQueryOne).toHaveBeenCalledTimes(1)
    expect(mockQueryAll).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })
})
