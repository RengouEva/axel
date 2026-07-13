import { queryOne, execute } from "@/lib/db"
import type { ShopSettings } from "@/lib/services-pro-types"

export async function getShopSettings(shopId: string): Promise<ShopSettings | null> {
  const settings = await queryOne<any>("SELECT * FROM ShopSettings WHERE shopId = ?", [shopId])
  if (!settings) return null
  return {
    ...settings,
    hours: settings.hours ? JSON.parse(settings.hours) : null,
    socialLinks: settings.socialLinks ? JSON.parse(settings.socialLinks) : null,
    contactInfo: settings.contactInfo ? JSON.parse(settings.contactInfo) : null,
  }
}

export async function upsertShopSettings(shopId: string, data: Partial<ShopSettings>): Promise<void> {
  const existing = await queryOne<any>("SELECT shopId FROM ShopSettings WHERE shopId = ?", [shopId])
  if (existing) {
    const updates: string[] = []
    const params: unknown[] = []
    if (data.hours !== undefined) { updates.push("hours = ?"); params.push(JSON.stringify(data.hours)) }
    if (data.socialLinks !== undefined) { updates.push("socialLinks = ?"); params.push(JSON.stringify(data.socialLinks)) }
    if (data.deliveryPolicy !== undefined) { updates.push("deliveryPolicy = ?"); params.push(data.deliveryPolicy) }
    if (data.returnPolicy !== undefined) { updates.push("returnPolicy = ?"); params.push(data.returnPolicy) }
    if (data.contactInfo !== undefined) { updates.push("contactInfo = ?"); params.push(JSON.stringify(data.contactInfo)) }
    if (data.seoDescription !== undefined) { updates.push("seoDescription = ?"); params.push(data.seoDescription) }
    if (data.seoKeywords !== undefined) { updates.push("seoKeywords = ?"); params.push(data.seoKeywords) }
    if (updates.length > 0) {
      params.push(shopId)
      await execute(`UPDATE ShopSettings SET ${updates.join(", ")} WHERE shopId = ?`, params)
    }
  } else {
    await execute(
      `INSERT INTO ShopSettings (shopId, hours, socialLinks, deliveryPolicy, returnPolicy, contactInfo, seoDescription, seoKeywords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [shopId,
       data.hours ? JSON.stringify(data.hours) : null,
       data.socialLinks ? JSON.stringify(data.socialLinks) : null,
       data.deliveryPolicy || null, data.returnPolicy || null,
       data.contactInfo ? JSON.stringify(data.contactInfo) : null,
       data.seoDescription || null, data.seoKeywords || null]
    )
  }
}

export async function updateShopBranding(shopId: string, data: {
  logo?: string; coverImage?: string; name?: string; description?: string; phone?: string; email?: string
}): Promise<void> {
  const updates: string[] = []
  const params: unknown[] = []
  if (data.logo !== undefined) { updates.push("logo = ?"); params.push(data.logo) }
  if (data.coverImage !== undefined) { updates.push("coverImage = ?"); params.push(data.coverImage) }
  if (data.name !== undefined) { updates.push("name = ?"); params.push(data.name) }
  if (data.description !== undefined) { updates.push("description = ?"); params.push(data.description) }
  if (data.phone !== undefined) { updates.push("phone = ?"); params.push(data.phone) }
  if (data.email !== undefined) { updates.push("email = ?"); params.push(data.email) }
  if (updates.length > 0) {
    params.push(shopId)
    await execute(`UPDATE Shop SET ${updates.join(", ")} WHERE id = ?`, params)
  }
}
