import type { Product } from "./product-types"
export type { Product }
export { hasCreditRates } from "./product-types"
import { queryAll, queryOne } from "@/lib/db"
import { cached } from "@/lib/cache"
import { getOrganicProducts, batchCalculateScores, normalizeScores, applyRotation } from "./organic-ranking"
import { getShopBySlug } from "./shops"

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  premium: { label: "Premium", color: "#FFD700", icon: "crown" },
  verified: { label: "Vérifié", color: "#1DA1F2", icon: "verified" },
  featured: { label: "En vedette", color: "#FF6B35", icon: "star" },
}

async function fetchShopBadges(shopId: string) {
  if (!shopId) return []
  const badges = await queryAll<any>(
    "SELECT type, label, color, icon FROM ShopBadge WHERE shopId = ? AND expiresAt IS NULL",
    [shopId]
  )
  return badges.map(b => ({
    type: b.type,
    label: b.label || BADGE_CONFIG[b.type]?.label || b.type,
    color: b.color || BADGE_CONFIG[b.type]?.color || "#64748B",
    icon: b.icon || BADGE_CONFIG[b.type]?.icon || "award",
  }))
}

export async function formatProduct(p: any, boostedIds?: Set<number>): Promise<Product> {
  const shopId = p.shop_id ?? p.shopId
  const shopBadges = shopId ? await fetchShopBadges(shopId) : []
  const boosted = boostedIds ? boostedIds.has(p.id) : false

  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    monthlyPrice: p.monthlyPrice,
    rating: p.rating,
    reviews: p.reviews,
    inStock: Boolean(p.inStock),
    promotion: Boolean(p.promotion),
    image: p.image,
    images: typeof p.images === "string" ? JSON.parse(p.images) : (p.images ?? []),
    slug: p.slug,
    creditRates: p.creditRates ?? undefined,
    description: p.description ?? undefined,
    creditMonths: p.creditMonths ?? undefined,
    shopId: shopId ?? undefined,
    shop: shopId ? {
      id: p.shop_id ?? "",
      name: p.shop_name ?? "",
      slug: p.shop_slug ?? "",
      logo: p.shop_logo ?? "",
      category: p.shop_category ?? "",
      badges: shopBadges,
    } : undefined,
    badges: [],
    boosted,
  }
}

export async function formatProductList(products: any[], boostedIds?: Set<number>): Promise<Product[]> {
  return Promise.all(products.map(p => formatProduct(p, boostedIds)))
}

export async function getProducts(): Promise<Product[]> {
  const data = await queryAll<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category
     FROM Product p
     LEFT JOIN Shop s ON s.id = p.shopId
     ORDER BY p.createdAt DESC`
  )
  return formatProductList(data)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return cached(`product:${slug}`, async () => {
  const product = await queryOne<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category
     FROM Product p
     LEFT JOIN Shop s ON s.id = p.shopId
     WHERE p.slug = ?`,
    [slug]
  )
  return product ? formatProduct(product) : null
  }, 60_000)
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const data = await queryAll<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category
     FROM Product p
     LEFT JOIN Shop s ON s.id = p.shopId
     WHERE p.category = ?
     ORDER BY p.createdAt DESC`,
    [category]
  )
  return formatProductList(data)
}

export async function getProductsByShop(shopSlug: string): Promise<Product[]> {
  const data = await queryAll<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category
     FROM Product p
     JOIN Shop s ON s.id = p.shopId
     WHERE s.slug = ?
     ORDER BY p.createdAt DESC`,
    [shopSlug]
  )
  return formatProductList(data)
}

export async function getPromotedProducts(): Promise<Product[]> {
  return cached("promoted-products", async () => {
  const data = await queryAll<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category
     FROM Product p
     LEFT JOIN Shop s ON s.id = p.shopId
     WHERE p.promotion = 1
     ORDER BY p.createdAt DESC`
  )
  return formatProductList(data)
  }, 60_000)
}

export async function getNewProducts(limit: number = 4): Promise<Product[]> {
  return cached("new-products", async () => {
  const data = await queryAll<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category
     FROM Product p
     LEFT JOIN Shop s ON s.id = p.shopId
     ORDER BY p.createdAt DESC
     LIMIT ?`,
    [limit]
  )
  return formatProductList(data)
  }, 60_000)
}

export async function getRankedProducts(options: {
  category?: string
  search?: string
  brand?: string
  page?: number
  limit?: number
  sort?: string
  country?: string
  city?: string
} = {}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams()
  if (options.category) params.set("category", options.category)
  if (options.search) params.set("search", options.search)
  if (options.brand) params.set("brand", options.brand)
  if (options.sort) params.set("sort", options.sort)
  if (options.country) params.set("country", options.country)
  if (options.city) params.set("city", options.city)

  const result = await getOrganicProducts(
    params,
    options.page || 1,
    options.limit || 20
  )

  const products = await formatProductList(result.products)
  return {
    products,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  }
}

export async function getRankedProductsForCategory(
  categoryName: string,
  limit: number = 8
): Promise<Product[]> {
  const params = new URLSearchParams()
  params.set("category", categoryName)
  params.set("limit", String(limit))

  const result = await getOrganicProducts(params, 1, limit)
  return formatProductList(result.products)
}

export async function getRankedProductsByCategory(categoryName: string): Promise<Product[]> {
  return getRankedProductsForCategory(categoryName, 50)
}

export async function getRankedProductsByShop(shopSlug: string): Promise<Product[]> {
  const shop = await getShopBySlug(shopSlug)
  if (!shop) return []
  const params = new URLSearchParams()
  params.set("shopId", shop.id)
  params.set("limit", "50")

  const result = await getOrganicProducts(params, 1, 50)
  return formatProductList(result.products)
}
