import { NextResponse } from "next/server"
import { execute, queryOne } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"
import { generateId } from "@/lib/ads"

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { campaignId, amount, paymentMethod, durationDays } = body

    if (!campaignId || !amount || !paymentMethod) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const campaign = await queryOne<any>("SELECT id, userId, shopId, status FROM AdCampaign WHERE id = ?", [campaignId])
    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 })
    }
    if (campaign.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    if (campaign.status !== "pending" && campaign.status !== "draft") {
      return NextResponse.json({ error: "La campagne n'est pas en attente de paiement" }, { status: 400 })
    }

    const txnId = generateId("TXN")
    await execute(
      "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, 'ad', 'completed', ?)",
      [txnId, campaign.shopId, auth.user.userId, amount, JSON.stringify({ campaignId, paymentMethod, durationDays })]
    )

    await execute(
      "UPDATE AdCampaign SET status = 'active', budget = budget + ? WHERE id = ?",
      [amount, campaignId]
    )

    await execute(
      "INSERT INTO AdCampaignNotification (id, campaignId, userId, type, title, message) VALUES (?, ?, ?, 'payment_validated', 'Paiement validé', 'Le paiement de votre campagne a été confirmé.')",
      [generateId("NOTIF"), campaignId, auth.user.userId]
    )

    return NextResponse.json({ success: true, transactionId: txnId })
  } catch (error) {
    console.error("[ADS_PAYMENTS]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
