import { NextResponse } from "next/server"
import { execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"
import { generateId } from "@/lib/ads"

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { campaignId, type } = body

    if (!campaignId || !type) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const notificationMessages: Record<string, { title: string; message: string }> = {
      created: { title: "Campagne créée", message: "Votre campagne publicitaire a été créée avec succès." },
      payment_validated: { title: "Paiement validé", message: "Le paiement de votre campagne a été confirmé." },
      started: { title: "Campagne en diffusion", message: "Votre campagne publicitaire est maintenant en cours de diffusion." },
      budget_low: { title: "Budget presque épuisé", message: "Votre budget publicitaire est bientôt épuisé." },
      ended: { title: "Campagne terminée", message: "Votre campagne publicitaire est terminée." },
      performance: { title: "Performance notable", message: "Votre campagne enregistre d'excellentes performances !" },
    }

    const notif = notificationMessages[type]
    if (!notif) {
      return NextResponse.json({ error: "Type de notification invalide" }, { status: 400 })
    }

    await execute(
      "INSERT INTO AdCampaignNotification (id, campaignId, userId, type, title, message) VALUES (?, ?, ?, ?, ?, ?)",
      [generateId("NOTIF"), campaignId, auth.user.userId, type, notif.title, notif.message]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADS_NOTIFICATIONS]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
