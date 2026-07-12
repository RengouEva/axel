import { queryAll, queryOne } from "@/lib/db"
import { cached } from "@/lib/cache"

export interface Product {
  id: number
  name: string
  brand: string
  category: string
  price: number
  monthlyPrice: number
  rating: number
  reviews: number
  inStock: boolean
  promotion: boolean
  image: string
  images: string[]
  slug: string
  creditRates?: string
  description?: string
  shopId?: string
  shop?: { id: string; name: string; slug: string; logo: string; category: string; badges?: { type: string; label: string; color: string; icon?: string }[] }
  badges?: { type: string; label: string; color: string; icon?: string }[]
  boosted?: boolean
}

export function formatProduct(p: any): Product {
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
    shopId: p.shop_id ?? p.shopId ?? undefined,
    shop: p.shop_id || p.shop_name ? {
      id: p.shop_id ?? "",
      name: p.shop_name ?? "",
      slug: p.shop_slug ?? "",
      logo: p.shop_logo ?? "",
      category: p.shop_category ?? "",
    } : undefined,
  }
}

export function formatProductList(products: any[]): Product[] {
  return products.map(formatProduct)
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
