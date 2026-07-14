import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getVariants,
  createVariant,
  deleteVariant,
  setStockAlert,
  getStockAlerts,
  schedulePublish,
} from "./products"

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

describe("getVariants", () => {
  it("returns variants array for a product", async () => {
    const variants = [
      { id: 1, productId: 10, name: "Color", value: "Red", stock: 5, sortOrder: 0 },
      { id: 2, productId: 10, name: "Color", value: "Blue", stock: 3, sortOrder: 1 },
    ]
    mockQueryAll.mockResolvedValueOnce(variants)

    const result = await getVariants(10)

    expect(result).toEqual(variants)
    expect(mockQueryAll).toHaveBeenCalledWith(
      "SELECT * FROM ProductVariant WHERE productId = ? ORDER BY sortOrder ASC, id ASC",
      [10]
    )
  })

  it("returns empty array when no variants exist", async () => {
    mockQueryAll.mockResolvedValueOnce([])

    const result = await getVariants(99)

    expect(result).toEqual([])
  })
})

describe("createVariant", () => {
  const data = {
    productId: 10,
    name: "Size",
    value: "XL",
    sku: "TEE-XL",
    price: 29.99,
    stock: 100,
    image: "xl.jpg",
  }

  it("inserts a variant and returns the full record", async () => {
    mockExecute.mockResolvedValueOnce({ insertId: 42 })
    const fullVariant = { id: 42, ...data, sortOrder: 0 }
    mockQueryOne.mockResolvedValueOnce(fullVariant)

    const result = await createVariant(data)

    expect(result).toEqual(fullVariant)
    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO ProductVariant (productId, name, value, sku, price, stock, image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [10, "Size", "XL", "TEE-XL", 29.99, 100, "xl.jpg"]
    )
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM ProductVariant WHERE id = ?",
      [42]
    )
  })

  it("uses defaults for optional fields", async () => {
    const minimalData = {
      productId: 10,
      name: "Size",
      value: "M",
    }
    mockExecute.mockResolvedValueOnce({ insertId: 43 })
    const fullVariant = { id: 43, ...minimalData, sku: null, price: null, stock: 0, image: null, sortOrder: 0 }
    mockQueryOne.mockResolvedValueOnce(fullVariant)

    const result = await createVariant(minimalData)

    expect(result).toEqual(fullVariant)
    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO ProductVariant (productId, name, value, sku, price, stock, image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [10, "Size", "M", null, null, 0, null]
    )
  })
})

describe("deleteVariant", () => {
  it("deletes the variant by id", async () => {
    mockExecute.mockResolvedValueOnce(undefined)

    await deleteVariant(7)

    expect(mockExecute).toHaveBeenCalledWith(
      "DELETE FROM ProductVariant WHERE id = ?",
      [7]
    )
  })
})

describe("setStockAlert", () => {
  it("creates a new stock alert when none exists", async () => {
    mockQueryOne.mockResolvedValueOnce(null)
    mockExecute.mockResolvedValueOnce(undefined)

    await setStockAlert(10, "shop-1", 5)

    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT id FROM StockAlert WHERE productId = ? AND shopId = ?",
      [10, "shop-1"]
    )
    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO StockAlert (productId, shopId, threshold) VALUES (?, ?, ?)",
      [10, "shop-1", 5]
    )
  })

  it("updates existing stock alert when one exists", async () => {
    mockQueryOne.mockResolvedValueOnce({ id: 99 })
    mockExecute.mockResolvedValueOnce(undefined)

    await setStockAlert(10, "shop-1", 10)

    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT id FROM StockAlert WHERE productId = ? AND shopId = ?",
      [10, "shop-1"]
    )
    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE StockAlert SET threshold = ?, notified = 0 WHERE id = ?",
      [10, 99]
    )
  })
})

describe("getStockAlerts", () => {
  it("returns stock alerts for a shop", async () => {
    const alerts = [
      { id: 1, productId: 10, shopId: "shop-1", threshold: 5, notified: false, productName: "T-Shirt", currentStock: 2 },
    ]
    mockQueryAll.mockResolvedValueOnce(alerts)

    const result = await getStockAlerts("shop-1")

    expect(result).toEqual(alerts)
    expect(mockQueryAll).toHaveBeenCalledWith(
      `SELECT sa.*, p.name as productName, p.image as productImage,
            COALESCE(ps.quantity, 0) as currentStock
     FROM StockAlert sa
     JOIN Product p ON p.id = sa.productId
     LEFT JOIN ProductStock ps ON ps.productId = p.id
     WHERE sa.shopId = ? AND sa.threshold > COALESCE(ps.quantity, 0)
     ORDER BY COALESCE(ps.quantity, 0) ASC`,
      ["shop-1"]
    )
  })

  it("returns empty array when no stock alerts", async () => {
    mockQueryAll.mockResolvedValueOnce([])

    const result = await getStockAlerts("shop-empty")

    expect(result).toEqual([])
  })
})

describe("schedulePublish", () => {
  it("inserts a scheduled publish entry", async () => {
    mockExecute.mockResolvedValueOnce(undefined)

    await schedulePublish(10, "2026-08-01T10:00:00Z")

    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO ProductScheduledPublish (productId, scheduledAt) VALUES (?, ?)",
      [10, "2026-08-01T10:00:00Z"]
    )
  })
})
