import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import type { AiRecommendation, AdSlot } from "@/lib/ads"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "sponsored_product"
    const budget = Number(searchParams.get("budget")) || 0
    const category = searchParams.get("category")

    const hour = new Date().getHours()

    const placementScores: { slot: AdSlot; score: number; reason: string }[] = [
      { slot: "HOME_FEATURED", score: 92, reason: "Fort trafic utilisateur, taux d'engagement élevé" },
      { slot: "SEARCH_INLINE", score: 88, reason: "Ciblage contextuel précis" },
      { slot: "SEARCH_TOP", score: 85, reason: "Visibilité maximale en recherche" },
      { slot: "CATEGORY_INLINE", score: 82, reason: "Pertinence catégorielle" },
      { slot: "PRODUCT_SIMILAR", score: 80, reason: "Intention d'achat élevée" },
      { slot: "HOME_INLINE", score: 75, reason: "Exposition large" },
      { slot: "PRODUCT_RECOMMENDED", score: 73, reason: "Recommandation contextuelle" },
      { slot: "MOBILE_FEED", score: 70, reason: "Croissance mobile" },
      { slot: "PRODUCT_SELLER", score: 65, reason: "Cross-selling" },
      { slot: "SHOP_PRODUCTS", score: 60, reason: "Visibilité boutique" },
    ]

    if (category) {
      const catBoost = placementScores.find(p => p.slot.includes("CATEGORY"))
      if (catBoost) catBoost.score = Math.min(100, catBoost.score + 10)
    }

    const recommendedPlacements = placementScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    let optimalBudget = 5000
    if (type === "sponsored_product") optimalBudget = 3000
    else if (type === "sponsored_shop") optimalBudget = 8000
    else if (type === "banner") optimalBudget = 15000
    else if (type === "event") optimalBudget = 25000

    if (budget > 0) {
      optimalBudget = Math.max(budget, Math.round(budget * 1.2))
    }

    const bestHours = [
      `${String((hour + 8) % 24).padStart(2, "0")}h-${String((hour + 10) % 24).padStart(2, "0")}h`,
      `${String((hour + 14) % 24).padStart(2, "0")}h-${String((hour + 16) % 24).padStart(2, "0")}h`,
      `${String((hour + 18) % 24).padStart(2, "0")}h-${String((hour + 20) % 24).padStart(2, "0")}h`,
    ]

    const recommendation: AiRecommendation = {
      recommendedBudget: {
        min: Math.round(optimalBudget * 0.7),
        max: Math.round(optimalBudget * 1.5),
        optimal: optimalBudget,
      },
      recommendedPlacements,
      predictedPerformance: {
        estimatedImpressions: Math.round(optimalBudget * 8),
        estimatedClicks: Math.round(optimalBudget * 0.4),
        estimatedCtr: `${(Math.random() * 3 + 1.5).toFixed(2)}%`,
        estimatedCpc: Math.round(optimalBudget / Math.max(Math.round(optimalBudget * 0.4), 1)),
      },
      bestHours,
      confidence: 0.85 + Math.random() * 0.1,
    }

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error("[ADS_AI]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
