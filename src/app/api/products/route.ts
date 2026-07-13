import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { validateInput, productCreateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { getOrganicProducts as getOrganicProductsV2 } from "@/data/organic-ranking"
import { formatProductList } from "@/data/products"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`products:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const { searchParams } = new URL(request.url)
    const organic = searchParams.get("organic") !== "false"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE))))

    if (organic) {
      const result = await getOrganicProductsV2(searchParams, page, limit)
      const formatted = formatProductList(result.products.map((p: any) => ({
        ...p,
        images: typeof p.images === "string" ? p.images : JSON.stringify(p.images || []),
      })))
      return NextResponse.json({
        products: formatted,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      }, { headers })
    }

    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort")
    const id = searchParams.get("id")

    if (id) {
      const product = await queryOne<any>(
        `SELECT p.*, s.id as _shop_id, s.name as _shop_name, s.slug as _shop_slug, s.logo as _shop_logo, s.category as _shop_category
         FROM Product p LEFT JOIN Shop s ON s.id = p.shopId WHERE p.id = ?`,
        [Number(id)]
      )
      if (!product) return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
      if (product._shop_id) {
        const badges = await queryAll<any>("SELECT type, label, color, icon FROM ShopBadge WHERE shopId = ?", [product._shop_id])
        product.shop = { id: product._shop_id, name: product._shop_name, slug: product._shop_slug, logo: product._shop_logo, category: product._shop_category, badges }
      } else {
        product.shop = null
      }
      delete product._shop_id; delete product._shop_name; delete product._shop_slug; delete product._shop_logo; delete product._shop_category
      return NextResponse.json(product, { headers })
    }

    const now = new Date()

    const conditions: string[] = []
    const params: unknown[] = []
    if (category && category !== "all") {
      conditions.push("p.category = ?")
      params.push(category)
    }
    if (search) {
      conditions.push("(p.name LIKE ? OR p.brand LIKE ?)")
      params.push(`%${search}%`, `%${search}%`)
    }
    const shopId = searchParams.get("shopId")
    if (shopId) {
      conditions.push("p.shopId = ?")
      params.push(shopId)
    }
    const whereSQL = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""

    let orderBySQL = "ORDER BY p.id ASC"
    if (sort === "price-asc") orderBySQL = "ORDER BY p.price ASC"
    else if (sort === "price-desc") orderBySQL = "ORDER BY p.price DESC"
    else if (sort === "rating") orderBySQL = "ORDER BY p.rating DESC"
    else if (sort === "newest") orderBySQL = "ORDER BY p.createdAt DESC"

    const [products, totalRow, boostCountRow] = await Promise.all([
      queryAll<any>(
        `SELECT p.*, s.id as _shop_id, s.name as _shop_name, s.slug as _shop_slug, s.logo as _shop_logo, s.category as _shop_category
         FROM Product p LEFT JOIN Shop s ON s.id = p.shopId ${whereSQL} ${orderBySQL} LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit]
      ),
      queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM Product p ${whereSQL}`, params),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM ProductBoost WHERE status = 'active' AND startDate <= ? AND endDate >= ?",
        [now, now]
      ),
    ])

    const total = totalRow?.count ?? 0
    const boostCount = boostCountRow?.count ?? 0

    const productIds = products.map(p => p.id)
    const shopIds = [...new Set(products.filter(p => p._shop_id).map(p => p._shop_id))]

    let badgesByShop: Record<string, any[]> = {}
    if (shopIds.length > 0) {
      const placeholders = shopIds.map(() => "?").join(",")
      const allBadges = await queryAll<any>(`SELECT shopId, type, label, color, icon FROM ShopBadge WHERE shopId IN (${placeholders})`, shopIds)
      for (const b of allBadges) {
        if (!badgesByShop[b.shopId]) badgesByShop[b.shopId] = []
        badgesByShop[b.shopId].push({ type: b.type, label: b.label, color: b.color, icon: b.icon })
      }
    }

    const mappedProducts = products.map(p => {
      const shop = p._shop_id ? {
        id: p._shop_id,
        name: p._shop_name,
        slug: p._shop_slug,
        logo: p._shop_logo,
        category: p._shop_category,
        badges: badgesByShop[p._shop_id] || [],
      } : null
      const { _shop_id, _shop_name, _shop_slug, _shop_logo, _shop_category, ...rest } = p
      return { ...rest, shop }
    })

    let boostedProductIds = new Set<number>()
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => "?").join(",")
      const boostedRows = await queryAll<{ productId: number }>(
        `SELECT productId FROM ProductBoost WHERE productId IN (${placeholders}) AND status = 'active' AND startDate <= ? AND endDate >= ?`,
        [...productIds, now, now]
      )
      boostedRows.forEach(b => boostedProductIds.add(b.productId))
    }

    let sortedProducts = mappedProducts
    if (!sort) {
      sortedProducts = [...mappedProducts].sort((a, b) => {
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

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
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

    const existingSlug = await queryOne<any>("SELECT id FROM Product WHERE slug = ?", [slug])
    if (existingSlug) {
      return NextResponse.json({ error: "Un produit avec ce nom existe déjà" }, { status: 409 })
    }

    const finalImages = images || JSON.stringify([image || "/images/visuel.png"])
    const finalImage = image || (JSON.parse(finalImages)[0]) || "/images/visuel.png"
    const months = creditMonths || 36

    const defaultRates = JSON.stringify({ "3": 0, "6": 0, "12": 3, "18": 5, "24": 5, "36": 8 })

    const result = await execute(
      `INSERT INTO Product (name, brand, category, price, monthlyPrice, description, image, images, creditRates, slug, shopId, inStock, promotion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand, category, price, Math.round(price / months), description || null, finalImage, finalImages, creditRates || defaultRates, slug, shop.id, inStock ?? true, promotion ?? false]
    )
    const newProduct = await queryOne<any>("SELECT * FROM Product WHERE id = ?", [result.insertId])
    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error("[PRODUCTS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
