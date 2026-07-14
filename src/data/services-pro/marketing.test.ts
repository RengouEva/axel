import { describe, it, expect, vi, beforeEach } from "vitest"

const mockQueryOne = vi.fn()
const mockQueryAll = vi.fn()
const mockExecute = vi.fn()

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryAll: (...args: unknown[]) => mockQueryAll(...args),
  execute: (...args: unknown[]) => mockExecute(...args),
}))

import { getPromoCodes, createPromoCode, toggleFlashSale, getFlashSales, createBogoOffer } from "./marketing"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getPromoCodes", () => {
  it("returns promo codes for a shop", async () => {
    const mockPromos = [
      { id: "promo-1", code: "SAVE10" },
      { id: "promo-2", code: "SAVE20" },
    ]
    mockQueryAll.mockResolvedValue(mockPromos)

    const result = await getPromoCodes("shop-1")

    expect(mockQueryAll).toHaveBeenCalledWith(
      "SELECT * FROM PromoCode WHERE shopId = ? ORDER BY createdAt DESC",
      ["shop-1"]
    )
    expect(result).toEqual(mockPromos)
  })

  it("returns empty array when no promo codes", async () => {
    mockQueryAll.mockResolvedValue([])

    const result = await getPromoCodes("shop-1")

    expect(result).toEqual([])
  })
})

describe("createPromoCode", () => {
  const shopId = "shop-1"
  const data = {
    code: "SUMMER21",
    discountType: "percentage",
    discountValue: 15,
    minPurchase: 100,
    maxUses: 50,
    startDate: "2026-01-01",
    endDate: "2026-02-01",
  }

  it("inserts a promo code and returns it", async () => {
    const mockPromo = { id: "PROMO-ABC123", shopId, ...data }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue(mockPromo)

    const result = await createPromoCode(shopId, data)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO PromoCode"),
      [
        expect.any(String), shopId, data.code, data.discountType, data.discountValue,
        data.minPurchase, data.maxUses, null, null, data.startDate, data.endDate,
      ]
    )
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM PromoCode WHERE id = ?",
      [expect.any(String)]
    )
    expect(result).toEqual(mockPromo)
  })

  it("handles applicable products and categories", async () => {
    const dataWithFilters = {
      ...data,
      applicableProducts: [1, 2, 3],
      applicableCategories: ["shoes", "bags"],
    }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue({ id: "PROMO-DEF456", shopId, ...dataWithFilters })

    await createPromoCode(shopId, dataWithFilters)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        expect.any(String), shopId, data.code, data.discountType, data.discountValue,
        data.minPurchase, data.maxUses,
        "[1,2,3]",
        '["shoes","bags"]',
        data.startDate, data.endDate,
      ])
    )
  })

  it("uses defaults for optional numeric fields", async () => {
    const minimalData = {
      code: "FLASH",
      discountType: "fixed",
      discountValue: 10,
      startDate: "2026-01-01",
      endDate: "2026-02-01",
    }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue({ id: "PROMO-GHI789", shopId, ...minimalData, minPurchase: 0, maxUses: 0 })

    await createPromoCode(shopId, minimalData)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      [expect.any(String), shopId, "FLASH", "fixed", 10, 0, 0, null, null, "2026-01-01", "2026-02-01"]
    )
  })
})

describe("toggleFlashSale", () => {
  it("activates a flash sale", async () => {
    mockExecute.mockResolvedValue(undefined)

    await toggleFlashSale("flash-1", true)

    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE FlashSale SET isActive = ? WHERE id = ?",
      [1, "flash-1"]
    )
  })

  it("deactivates a flash sale", async () => {
    mockExecute.mockResolvedValue(undefined)

    await toggleFlashSale("flash-1", false)

    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE FlashSale SET isActive = ? WHERE id = ?",
      [0, "flash-1"]
    )
  })
})

describe("getFlashSales", () => {
  it("returns flash sales with product IDs", async () => {
    const mockSales = [
      { id: "flash-1", name: "Weekend Deal" },
      { id: "flash-2", name: "Clearance" },
    ]
    mockQueryAll.mockReturnValueOnce(Promise.resolve(mockSales))
    mockQueryAll.mockReturnValueOnce(Promise.resolve([
      { flashSaleId: "flash-1", productId: 10 },
      { flashSaleId: "flash-1", productId: 20 },
      { flashSaleId: "flash-2", productId: 30 },
    ]))

    const result = await getFlashSales("shop-1")

    expect(mockQueryAll).toHaveBeenNthCalledWith(
      1,
      "SELECT * FROM FlashSale WHERE shopId = ? ORDER BY createdAt DESC",
      ["shop-1"]
    )
    expect(mockQueryAll).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("SELECT flashSaleId, productId FROM FlashSaleProduct WHERE flashSaleId IN"),
      ["flash-1", "flash-2"]
    )
    expect(result).toHaveLength(2)
    expect(result[0].products).toEqual([10, 20])
    expect(result[1].products).toEqual([30])
  })

  it("returns empty array when no flash sales", async () => {
    mockQueryAll.mockResolvedValue([])

    const result = await getFlashSales("shop-1")

    expect(mockQueryAll).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })
})

describe("createBogoOffer", () => {
  const shopId = "shop-1"
  const data = {
    name: "Buy 1 Get 1",
    buyQuantity: 1,
    getQuantity: 1,
    discountPercent: 50,
    startDate: "2026-01-01",
    endDate: "2026-02-01",
  }

  it("inserts a bogo offer and returns it", async () => {
    const mockOffer = { id: "BOGO-ABC123", shopId, ...data }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue(mockOffer)

    const result = await createBogoOffer(shopId, data)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO BogoOffer"),
      [
        expect.any(String), shopId, data.name, data.buyQuantity, data.getQuantity,
        data.discountPercent, null, data.startDate, data.endDate,
      ]
    )
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM BogoOffer WHERE id = ?",
      [expect.any(String)]
    )
    expect(result).toEqual(mockOffer)
  })

  it("handles applicable products", async () => {
    const dataWithProducts = { ...data, applicableProducts: [5, 10, 15] }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue({ id: "BOGO-DEF456", shopId, ...dataWithProducts })

    await createBogoOffer(shopId, dataWithProducts)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      [
        expect.any(String), shopId, data.name, data.buyQuantity, data.getQuantity,
        data.discountPercent, "[5,10,15]", data.startDate, data.endDate,
      ]
    )
  })

  it("defaults discountPercent to 100 when not provided", async () => {
    const dataNoDiscount = {
      name: "Buy 2 Get 1 Free",
      buyQuantity: 2,
      getQuantity: 1,
      startDate: "2026-01-01",
      endDate: "2026-02-01",
    }
    mockExecute.mockResolvedValue(undefined)
    mockQueryOne.mockResolvedValue({ id: "BOGO-GHI789", shopId, ...dataNoDiscount, discountPercent: 100 })

    await createBogoOffer(shopId, dataNoDiscount)

    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      [
        expect.any(String), shopId, "Buy 2 Get 1 Free", 2, 1, 100, null,
        "2026-01-01", "2026-02-01",
      ]
    )
  })
})
