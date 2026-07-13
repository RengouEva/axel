import { queryOne, queryAll, execute } from "@/lib/db"
import type { ProductVariant, ProductVariantGroup, ScheduledPublish, StockAlert } from "@/lib/services-pro-types"

export async function getVariants(productId: number): Promise<ProductVariant[]> {
  return queryAll<ProductVariant>(
    "SELECT * FROM ProductVariant WHERE productId = ? ORDER BY sortOrder ASC, id ASC",
    [productId]
  )
}

export async function getVariantGroups(productId: number): Promise<ProductVariantGroup[]> {
  return queryAll<ProductVariantGroup>(
    "SELECT * FROM ProductVariantGroup WHERE productId = ? ORDER BY sortOrder ASC, id ASC",
    [productId]
  )
}

export async function createVariant(data: {
  productId: number; name: string; value: string; sku?: string
  price?: number; stock?: number; image?: string
}): Promise<ProductVariant | null> {
  const result = await execute(
    `INSERT INTO ProductVariant (productId, name, value, sku, price, stock, image)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.productId, data.name, data.value, data.sku || null,
     data.price || null, data.stock ?? 0, data.image || null]
  )
  return queryOne<ProductVariant>("SELECT * FROM ProductVariant WHERE id = ?", [result.insertId])
}

export async function updateVariant(id: number, data: Partial<ProductVariant>): Promise<void> {
  const fields: string[] = []
  const params: unknown[] = []
  if (data.name !== undefined) { fields.push("name = ?"); params.push(data.name) }
  if (data.value !== undefined) { fields.push("value = ?"); params.push(data.value) }
  if (data.sku !== undefined) { fields.push("sku = ?"); params.push(data.sku) }
  if (data.price !== undefined) { fields.push("price = ?"); params.push(data.price) }
  if (data.stock !== undefined) { fields.push("stock = ?"); params.push(data.stock) }
  if (data.image !== undefined) { fields.push("image = ?"); params.push(data.image) }
  if (fields.length > 0) {
    params.push(id)
    await execute(`UPDATE ProductVariant SET ${fields.join(", ")} WHERE id = ?`, params)
  }
}

export async function deleteVariant(id: number): Promise<void> {
  await execute("DELETE FROM ProductVariant WHERE id = ?", [id])
}

export async function duplicateProduct(productId: number): Promise<number | null> {
  const original = await queryOne<any>("SELECT * FROM Product WHERE id = ?", [productId])
  if (!original) return null

  const newSlug = `${original.slug}-copie-${Date.now().toString(36)}`
  const result = await execute(
    `INSERT INTO Product (name, brand, category, price, monthlyPrice, description, image, images,
      creditRates, slug, shopId, inStock, promotion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [`${original.name} (Copie)`, original.brand, original.category, original.price,
     original.monthlyPrice, original.description, original.image, original.images,
     original.creditRates, newSlug, original.shopId, original.inStock, 0]
  )

  const variants = await getVariants(productId)
  if (variants.length > 0 && result.insertId) {
    for (const v of variants) {
      await execute(
        `INSERT INTO ProductVariant (productId, name, value, sku, price, stock, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [result.insertId, v.name, v.value, v.sku, v.price, v.stock, v.image]
      )
    }
  }
  return result.insertId ?? null
}

export async function getScheduledPublishes(shopId: string): Promise<ScheduledPublish[]> {
  return queryAll<ScheduledPublish>(
    `SELECT sp.*, p.name as productName
     FROM ProductScheduledPublish sp JOIN Product p ON p.id = sp.productId
     WHERE p.shopId = ? ORDER BY sp.scheduledAt ASC`,
    [shopId]
  )
}

export async function schedulePublish(productId: number, scheduledAt: string): Promise<void> {
  await execute(
    `INSERT INTO ProductScheduledPublish (productId, scheduledAt) VALUES (?, ?)`,
    [productId, scheduledAt]
  )
}

export async function cancelScheduledPublish(id: number): Promise<void> {
  await execute(
    "UPDATE ProductScheduledPublish SET status = 'cancelled' WHERE id = ?",
    [id]
  )
}

export async function processScheduledPublishes(): Promise<void> {
  const now = new Date()
  const pendings = await queryAll<any>(
    "SELECT * FROM ProductScheduledPublish WHERE status = 'pending' AND scheduledAt <= ?",
    [now]
  )
  for (const p of pendings) {
    await execute(
      "UPDATE Product SET inStock = 1 WHERE id = ?",
      [p.productId]
    )
    await execute(
      "UPDATE ProductScheduledPublish SET status = 'published', publishedAt = NOW() WHERE id = ?",
      [p.id]
    )
  }
}

export async function getStockAlerts(shopId: string): Promise<StockAlert[]> {
  return queryAll<StockAlert>(
    `SELECT sa.*, p.name as productName, p.image as productImage,
            COALESCE(ps.quantity, 0) as currentStock
     FROM StockAlert sa
     JOIN Product p ON p.id = sa.productId
     LEFT JOIN ProductStock ps ON ps.productId = p.id
     WHERE sa.shopId = ? AND sa.threshold > COALESCE(ps.quantity, 0)
     ORDER BY COALESCE(ps.quantity, 0) ASC`,
    [shopId]
  )
}

export async function setStockAlert(productId: number, shopId: string, threshold: number): Promise<void> {
  const existing = await queryOne<any>(
    "SELECT id FROM StockAlert WHERE productId = ? AND shopId = ?",
    [productId, shopId]
  )
  if (existing) {
    await execute("UPDATE StockAlert SET threshold = ?, notified = 0 WHERE id = ?", [threshold, existing.id])
  } else {
    await execute(
      "INSERT INTO StockAlert (productId, shopId, threshold) VALUES (?, ?, ?)",
      [productId, shopId, threshold]
    )
  }
}

export async function removeStockAlert(id: number): Promise<void> {
  await execute("DELETE FROM StockAlert WHERE id = ?", [id])
}
