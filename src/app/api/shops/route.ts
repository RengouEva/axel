import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
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

    const conditions: string[] = []
    const params: unknown[] = []
    if (sellerId) {
      conditions.push("sellerId = ?")
      params.push(Number(sellerId))
    }
    if (search) {
      conditions.push("name LIKE ?")
      params.push(`%${search}%`)
    }
    const whereSQL = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""

    const shops = await queryAll<any>(
      `SELECT id, sellerId, name, slug, description, phone, email, logo, coverImage, countryId, cityId, districtId, address, category, rating, totalSales, createdAt FROM Shop ${whereSQL} ORDER BY createdAt DESC`,
      params
    )
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

    const existingShop = await queryOne<any>("SELECT id FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (existingShop) {
      return NextResponse.json({ error: "Vous avez déjà une boutique" }, { status: 409 })
    }

    const { name, description, phone, email, countryId, cityId, districtId, address, category } = validation.data
    const slug = slugify(name) + "-" + Date.now().toString(36)
    const shopId = `SHOP-${Date.now().toString(36).toUpperCase()}`

    await execute(
      `INSERT INTO Shop (id, sellerId, name, slug, description, phone, email, logo, coverImage, countryId, cityId, districtId, address, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [shopId, auth.user.userId, name, slug, description || "", phone || "", email || "",
       "/images/shops/default.svg", "/images/shops/default-cover.svg",
       countryId, cityId, districtId, address || "", category]
    )

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE id = ?", [shopId])
    return NextResponse.json(shop, { status: 201 })
  } catch (error) {
    console.error("[SHOPS_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
