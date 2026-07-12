import { NextResponse } from "next/server"
import { queryOne, queryAll } from "@/lib/db"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`categories:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (slug) {
      const category = await queryOne<any>("SELECT * FROM Category WHERE slug = ?", [slug])
      if (!category) return NextResponse.json({ error: "Catégorie non trouvée" }, { status: 404 })
      return NextResponse.json(category, { headers })
    }

    const categories = await queryAll<any>("SELECT * FROM Category")
    return NextResponse.json({ categories }, { headers })
  } catch (error) {
    console.error("[CATEGORIES_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
