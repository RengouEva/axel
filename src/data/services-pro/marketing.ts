import { queryOne, queryAll, execute } from "@/lib/db"
import type { PromoCode, FlashSale, ProductPack, BogoOffer } from "@/lib/services-pro-types"

export async function getPromoCodes(shopId: string): Promise<PromoCode[]> {
  return queryAll<PromoCode>(
    "SELECT * FROM PromoCode WHERE shopId = ? ORDER BY createdAt DESC",
    [shopId]
  )
}

export async function createPromoCode(shopId: string, data: {
  code: string; discountType: string; discountValue: number; minPurchase?: number
  maxUses?: number; applicableProducts?: number[]; applicableCategories?: string[]
  startDate: string; endDate: string
}): Promise<PromoCode | null> {
  const id = `PROMO-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  await execute(
    `INSERT INTO PromoCode (id, shopId, code, discountType, discountValue, minPurchase, maxUses,
      applicableProducts, applicableCategories, startDate, endDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, shopId, data.code, data.discountType, data.discountValue, data.minPurchase ?? 0,
     data.maxUses ?? 0,
     data.applicableProducts ? JSON.stringify(data.applicableProducts) : null,
     data.applicableCategories ? JSON.stringify(data.applicableCategories) : null,
     data.startDate, data.endDate]
  )
  return queryOne<PromoCode>("SELECT * FROM PromoCode WHERE id = ?", [id])
}

export async function deletePromoCode(id: string): Promise<void> {
  await execute("DELETE FROM PromoCode WHERE id = ?", [id])
}

export async function getFlashSales(shopId: string): Promise<FlashSale[]> {
  const sales = await queryAll<any>(
    "SELECT * FROM FlashSale WHERE shopId = ? ORDER BY createdAt DESC",
    [shopId]
  )
  for (const sale of sales) {
    const products = await queryAll<any>(
      "SELECT productId FROM FlashSaleProduct WHERE flashSaleId = ?",
      [sale.id]
    )
    sale.products = products.map((p: any) => p.productId)
  }
  return sales as FlashSale[]
}

export async function createFlashSale(shopId: string, data: {
  name: string; description?: string; discountPercent: number; productIds: number[]
  startDate: string; endDate: string
}): Promise<FlashSale | null> {
  const id = `FLASH-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  await execute(
    `INSERT INTO FlashSale (id, shopId, name, description, discountPercent, startDate, endDate)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, shopId, data.name, data.description || null, data.discountPercent, data.startDate, data.endDate]
  )
  for (const pid of data.productIds) {
    await execute(
      "INSERT INTO FlashSaleProduct (flashSaleId, productId) VALUES (?, ?)",
      [id, pid]
    )
  }
  return queryOne<FlashSale>("SELECT * FROM FlashSale WHERE id = ?", [id])
}

export async function toggleFlashSale(id: string, isActive: boolean): Promise<void> {
  await execute("UPDATE FlashSale SET isActive = ? WHERE id = ?", [isActive ? 1 : 0, id])
}

export async function getProductPacks(shopId: string): Promise<ProductPack[]> {
  const packs = await queryAll<any>("SELECT * FROM ProductPack WHERE shopId = ? ORDER BY createdAt DESC", [shopId])
  return packs.map((p: any) => ({
    ...p,
    products: typeof p.products === 'string' ? JSON.parse(p.products) : p.products,
  }))
}

export async function createProductPack(shopId: string, data: {
  name: string; description?: string; products: { productId: number; quantity: number }[]
  packPrice: number; stock?: number; image?: string; startDate?: string; endDate?: string
}): Promise<ProductPack | null> {
  const id = `PACK-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  const originalPrice = 0
  await execute(
    `INSERT INTO ProductPack (id, shopId, name, description, products, packPrice, originalPrice, stock, image, startDate, endDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, shopId, data.name, data.description || null, JSON.stringify(data.products),
     data.packPrice, originalPrice, data.stock ?? 0, data.image || null,
     data.startDate || null, data.endDate || null]
  )
  return queryOne<ProductPack>("SELECT * FROM ProductPack WHERE id = ?", [id])
}

export async function deleteProductPack(id: string): Promise<void> {
  await execute("DELETE FROM ProductPack WHERE id = ?", [id])
}

export async function getBogoOffers(shopId: string): Promise<BogoOffer[]> {
  return queryAll<BogoOffer>(
    "SELECT * FROM BogoOffer WHERE shopId = ? ORDER BY createdAt DESC",
    [shopId]
  )
}

export async function createBogoOffer(shopId: string, data: {
  name: string; buyQuantity: number; getQuantity: number; discountPercent?: number
  applicableProducts?: number[]; startDate: string; endDate: string
}): Promise<BogoOffer | null> {
  const id = `BOGO-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  await execute(
    `INSERT INTO BogoOffer (id, shopId, name, buyQuantity, getQuantity, discountPercent, applicableProducts, startDate, endDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, shopId, data.name, data.buyQuantity, data.getQuantity, data.discountPercent ?? 100,
     data.applicableProducts ? JSON.stringify(data.applicableProducts) : null,
     data.startDate, data.endDate]
  )
  return queryOne<BogoOffer>("SELECT * FROM BogoOffer WHERE id = ?", [id])
}

export async function deleteBogoOffer(id: string): Promise<void> {
  await execute("DELETE FROM BogoOffer WHERE id = ?", [id])
}
