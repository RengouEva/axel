import { NextResponse } from "next/server"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { calculateOrganicScore, getProductWithShop } from "@/data/organic-ranking"

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`organic-scores:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const { searchParams } = new URL(request.url)
    const productId = parseInt(searchParams.get("productId") || "")
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const brand = searchParams.get("brand")

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400, headers })
    }

    const product = await getProductWithShop(productId)
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404, headers })
    }

    const searchContext = search ? { query: search, category: category || undefined, brand: brand || undefined } : undefined

    const score = await calculateOrganicScore(productId, searchContext)

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        image: product.image,
        slug: product.slug,
      },
      score,
      weights: {
        relevance: 1.0,
        quality: 1.0,
        freshness: 1.0,
        availability: 1.0,
        price: 0.8,
        sellerReputation: 1.0,
        performance: 1.0,
        activity: 1.0,
        userExperience: 1.0,
      },
    }, { headers })
  } catch (error) {
    console.error("[ORGANIC_SCORES_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
