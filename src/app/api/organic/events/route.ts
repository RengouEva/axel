import { NextResponse } from "next/server"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { logProductEvent, getProductWithShop } from "@/data/organic-ranking"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`organic-events:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const body = await request.json()
    const { productId, event, userId, sessionId } = body

    if (!productId || !event) {
      return NextResponse.json({ error: "productId et event requis" }, { status: 400, headers })
    }

    const validEvents = ["view", "click", "favorite", "cart_add", "purchase"]
    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: "Type d'événement invalide" }, { status: 400, headers })
    }

    const product = await getProductWithShop(productId)
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404, headers })
    }

    await logProductEvent(productId, event, userId, sessionId, ip)

    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    console.error("[ORGANIC_EVENTS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
