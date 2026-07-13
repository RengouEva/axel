import { NextResponse } from "next/server"
import { execute, queryOne } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { campaignId, type, orderId, revenue } = body

    if (!campaignId || !type) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    if (!["cart_add", "sale", "conversion"].includes(type)) {
      return NextResponse.json({ error: "Type d'événement invalide" }, { status: 400 })
    }

    const campaign = await queryOne<any>("SELECT id, userId FROM AdCampaign WHERE id = ?", [campaignId])
    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 })
    }

    if (auth.user.role === "seller" && campaign.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    await execute(
      "INSERT INTO AdEvent (campaignId, type, userId, orderId, revenue) VALUES (?, ?, ?, ?, ?)",
      [campaignId, type, auth.user.userId || null, orderId || null, revenue || 0]
    )

    if (type === "cart_add") {
      await execute("UPDATE AdCampaign SET cartAdds = cartAdds + 1 WHERE id = ?", [campaignId])
    } else if (type === "sale" || type === "conversion") {
      await execute(
        `UPDATE AdCampaign SET sales = sales + 1, conversionRate = IF(impressions > 0, (sales / impressions) * 100, 0),
         roi = IF(spent > 0, ((? - spent) / spent) * 100, 0) WHERE id = ?`,
        [revenue || 0, campaignId]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADS_EVENTS]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
