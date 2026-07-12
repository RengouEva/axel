import { prisma } from "@/lib/prisma"

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
    inStock: p.inStock,
    promotion: p.promotion,
    image: p.image,
    images: typeof p.images === "string" ? JSON.parse(p.images) : (p.images ?? []),
    slug: p.slug,
    creditRates: p.creditRates ?? undefined,
    description: p.description ?? undefined,
    shopId: p.shopId ?? undefined,
    shop: p.shop ? {
      id: p.shop.id,
      name: p.shop.name,
      slug: p.shop.slug,
      logo: p.shop.logo,
      category: p.shop.category,
    } : undefined,
  }
}

export function formatProductList(products: any[]): Product[] {
  return products.map(formatProduct)
}

export async function getProducts(): Promise<Product[]> {
  const data = await prisma.product.findMany({
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  })
  return formatProductList(data)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { shop: true },
  })
  return product ? formatProduct(product) : null
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const data = await prisma.product.findMany({
    where: { category },
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  })
  return formatProductList(data)
}

export async function getProductsByShop(shopSlug: string): Promise<Product[]> {
  const data = await prisma.product.findMany({
    where: { shop: { slug: shopSlug } },
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  })
  return formatProductList(data)
}

export async function getPromotedProducts(): Promise<Product[]> {
  const data = await prisma.product.findMany({
    where: { promotion: true },
    include: { shop: true },
    orderBy: { createdAt: "desc" },
  })
  return formatProductList(data)
}

export async function getNewProducts(limit: number = 4): Promise<Product[]> {
  const data = await prisma.product.findMany({
    include: { shop: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return formatProductList(data)
}
