import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInput, shopCreateSchema } from "@/lib/validations"
import { requireAuth } from "@/lib/require-auth"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")
    const search = searchParams.get("search")

    let where: Record<string, unknown> = {}
    if (sellerId) where.sellerId = Number(sellerId)
    if (search) where.name = { contains: search }

    const shops = await prisma.shop.findMany({
      where,
      select: {
        id: true,
        sellerId: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        email: true,
        logo: true,
        coverImage: true,
        countryId: true,
        cityId: true,
        districtId: true,
        address: true,
        category: true,
        rating: true,
        totalSales: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(shops)
  } catch (error) {
    console.error("[SHOPS_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkApiRateLimit(ip)
    const rateLimitHeaders = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429, headers: rateLimitHeaders }
      )
    }

    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const body = await request.json()
    const validation = validateInput(shopCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const existingShop = await prisma.shop.findUnique({ where: { sellerId: auth.user.userId } })
    if (existingShop) {
      return NextResponse.json({ error: "Vous avez déjà une boutique" }, { status: 409 })
    }

    const { name, description, phone, email, countryId, cityId, districtId, address, category } = validation.data
    const slug = slugify(name) + "-" + Date.now().toString(36)

    const shop = await prisma.shop.create({
      data: {
        id: `SHOP-${Date.now().toString(36).toUpperCase()}`,
        sellerId: auth.user.userId,
        name,
        slug,
        description: description || "",
        phone: phone || "",
        email: email || "",
        logo: "/images/shops/default.svg",
        coverImage: "/images/shops/default-cover.svg",
        countryId,
        cityId,
        districtId,
        address: address || "",
        category,
      },
    })

    return NextResponse.json(shop, { status: 201 })
  } catch (error) {
    console.error("[SHOPS_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
