import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInput, productCreateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

const PAGE_SIZE = 20

const shopSelect = {
  id: true, name: true, slug: true, logo: true, category: true,
  badges: { select: { type: true, label: true, color: true, icon: true } },
}

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`products:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort")
    const id = searchParams.get("id")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE))))

    if (id) {
      const product = await prisma.product.findUnique({
        where: { id: Number(id) },
        include: { shop: { select: shopSelect } },
      })
      if (!product) return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
      return NextResponse.json(product, { headers })
    }

    const now = new Date()

    const where: Record<string, unknown> = {}
    if (category && category !== "all") where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
      ]
    }

    let orderBy: Record<string, string> = { id: "asc" }
    if (sort === "price-asc") orderBy = { price: "asc" }
    else if (sort === "price-desc") orderBy = { price: "desc" }
    else if (sort === "rating") orderBy = { rating: "desc" }
    else if (sort === "newest") orderBy = { createdAt: "desc" }

    const [products, total, boostCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          shop: { select: shopSelect },
        },
      }),
      prisma.product.count({ where }),
      prisma.productBoost.count({
        where: { status: "active", startDate: { lte: now }, endDate: { gte: now } },
      }),
    ])

    const boostedProductIds = new Set(
      (
        await prisma.productBoost.findMany({
          where: {
            productId: { in: products.map(p => p.id) },
            status: "active",
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { productId: true },
        })
      ).map(b => b.productId)
    )

    let sortedProducts = products
    if (!sort) {
      sortedProducts = [...products].sort((a, b) => {
        const aBoosted = boostedProductIds.has(a.id)
        const bBoosted = boostedProductIds.has(b.id)
        if (aBoosted && !bBoosted) return -1
        if (!aBoosted && bBoosted) return 1
        return 0
      })
    }

    return NextResponse.json({
      products: sortedProducts,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      activeBoosts: boostCount,
    }, { headers })
  } catch (error) {
    console.error("[PRODUCTS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`products-post:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await prisma.shop.findUnique({ where: { sellerId: auth.user.userId } })
    if (!shop) {
      return NextResponse.json({ error: "Vous devez d'abord créer une boutique" }, { status: 400 })
    }

    const body = await request.json()
    const validation = validateInput(productCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, brand, category, price, description, image, images, creditMonths, creditRates, inStock, promotion } = validation.data

    if (shop.category && category !== shop.category) {
      return NextResponse.json({
        error: `Votre boutique est spécialisée dans "${shop.category}". Vous ne pouvez pas publier de produits dans "${category}".`
      }, { status: 403 })
    }

    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    const existingSlug = await prisma.product.findUnique({ where: { slug } })
    if (existingSlug) {
      return NextResponse.json({ error: "Un produit avec ce nom existe déjà" }, { status: 409 })
    }

    const finalImages = images || JSON.stringify([image || "/images/visuel.png"])
    const finalImage = image || (JSON.parse(finalImages)[0]) || "/images/visuel.png"
    const months = creditMonths || 36

    const defaultRates = JSON.stringify({ "3": 0, "6": 0, "12": 3, "18": 5, "24": 5, "36": 8 })

    const newProduct = await prisma.product.create({
      data: {
        name,
        brand,
        category,
        price,
        monthlyPrice: Math.round(price / months),
        description: description || null,
        image: finalImage,
        images: finalImages,
        creditRates: creditRates || defaultRates,
        slug,
        shopId: shop.id,
        inStock: inStock ?? true,
        promotion: promotion ?? false,
      },
    })
    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error("[PRODUCTS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
