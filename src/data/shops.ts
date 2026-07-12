import { prisma } from "@/lib/prisma"

export interface Shop {
  id: string
  sellerId: number
  name: string
  slug: string
  description: string
  phone: string
  email: string
  logo: string
  coverImage: string
  countryId: string
  cityId: string
  districtId: string
  address: string
  category: string
  rating: number
  totalSales: number
  createdAt: string
}

export function formatShop(s: any): Shop {
  return {
    id: s.id,
    sellerId: s.sellerId,
    name: s.name,
    slug: s.slug,
    description: s.description,
    phone: s.phone,
    email: s.email,
    logo: s.logo,
    coverImage: s.coverImage,
    countryId: s.countryId,
    cityId: s.cityId,
    districtId: s.districtId,
    address: s.address,
    category: s.category,
    rating: s.rating,
    totalSales: s.totalSales,
    createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
  }
}

export async function getShops(): Promise<Shop[]> {
  const data = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
  })
  return data.map(formatShop)
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const shop = await prisma.shop.findUnique({
    where: { slug },
  })
  return shop ? formatShop(shop) : null
}
