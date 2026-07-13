import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { getRecommendations, applyRecommendation, dismissRecommendation } from "@/data/services-pro/ai"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || undefined

    const recommendations = await getRecommendations(shop.id, type)
    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("[SERVICES_PRO_AI_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const body = await request.json()
    const { action, id, productId } = body

    if (action === 'apply') {
      await applyRecommendation(id)
      return NextResponse.json({ message: "Recommandation appliquée" })
    }

    if (action === 'dismiss') {
      await dismissRecommendation(id)
      return NextResponse.json({ success: true })
    }

    if (action === 'analyze_product') {
      const { generatePriceRecommendation, detectUnderperformingProducts, generatePublishingRecommendation, estimateSales } = await import("@/data/services-pro/ai")

      if (productId) {
        await Promise.all([
          generatePriceRecommendation(shop.id, productId),
          estimateSales(shop.id, productId),
        ])
      }
      await Promise.all([
        detectUnderperformingProducts(shop.id),
        generatePublishingRecommendation(shop.id),
      ])

      return NextResponse.json({ message: "Analyse IA lancée" })
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
  } catch (error) {
    console.error("[SERVICES_PRO_AI_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
