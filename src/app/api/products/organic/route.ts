import { NextResponse } from "next/server"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { getOrganicProducts, checkFraud } from "@/data/organic-ranking"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`organic:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE))))

    let userContext: { userId?: number; countryId?: string; cityId?: string } | undefined = undefined
    const userId = searchParams.get("userId")
    const country = searchParams.get("country")
    const city = searchParams.get("city")

    if (userId || country || city) {
      userContext = {}
      if (userId) userContext.userId = parseInt(userId)
      if (country) userContext.countryId = country
      if (city) userContext.cityId = city
    }

    const result = await getOrganicProducts(searchParams, page, limit, userContext)

    return NextResponse.json(result, { headers })
  } catch (error) {
    console.error("[ORGANIC_RANKING]", error)
    return NextResponse.json({ error: "Erreur interne du moteur de classement" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`organic-post:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const body = await request.json()
    const { action, productId } = body

    if (action === "fraud-check" && productId) {
      const fraudResult = await checkFraud(productId)
      return NextResponse.json(fraudResult, { headers })
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400, headers })
  } catch (error) {
    console.error("[ORGANIC_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
