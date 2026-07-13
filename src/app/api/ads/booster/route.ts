import { NextResponse } from "next/server"
import { execute, queryAll, queryOne } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"
import { generateId, BOOSTER_EXPRESS_OPTIONS } from "@/lib/ads"

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { productId, durationDays, paymentMethod } = body

    if (!productId || !durationDays) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const option = BOOSTER_EXPRESS_OPTIONS.find(o => o.days === durationDays)
    if (!option) {
      return NextResponse.json({ error: "Durée invalide" }, { status: 400 })
    }

    const product = await queryOne<any>(
      `SELECT p.*, s.id as shopId FROM Product p JOIN Shop s ON s.id = p.shopId WHERE p.id = ? AND s.sellerId = ?`,
      [productId, auth.user.userId]
    )
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
    }

    const campaignId = generateId("AD")
    const now = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    await execute(
      `INSERT INTO AdCampaign (id, shopId, userId, name, type, objective, status, budget, spent, startDate, endDate, dailyBudget,
        targetCategory, productId, impressions, clicks, ctr, avgCpc, avgCpm, cartAdds, sales, conversionRate, roi, qualityScore)
       VALUES (?, ?, ?, ?, 'sponsored_product', 'visibility', 'active', ?, 0, ?, ?, 0,
        ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1.0)`,
      [campaignId, product.shopId, auth.user.userId, `Boost ${product.name}`, option.price,
       now.toISOString(), endDate.toISOString(), product.category, productId]
    )

    const placementsToAssign = ["HOME_FEATURED", "SEARCH_INLINE", "CATEGORY_INLINE"]
    for (const slot of placementsToAssign) {
      const placement = await queryOne<any>("SELECT id FROM AdPlacement WHERE slot = ? AND isActive = 1", [slot])
      if (placement) {
        await execute(
          "INSERT INTO AdCampaignPlacement (campaignId, placementId, bid) VALUES (?, ?, ?)",
          [campaignId, placement.id, Math.round(option.price / placementsToAssign.length)]
        )
      }
    }

    const txnId = generateId("TXN")
    await execute(
      "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, 'ad', 'completed', ?)",
      [txnId, product.shopId, auth.user.userId, option.price, JSON.stringify({ campaignId, booster: true, durationDays, productId })]
    )

    const campaign = await queryOne<any>("SELECT * FROM AdCampaign WHERE id = ?", [campaignId])

    return NextResponse.json({ campaign, success: true, status: "active" }, { status: 201 })
  } catch (error) {
    console.error("[ADS_BOOSTER]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
