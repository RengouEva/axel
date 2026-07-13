import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const { campaignId, placementId, sessionId, userId } = await request.json()
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const ua = request.headers.get("user-agent") || ""

    if (!campaignId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const rateLimit = checkRateLimit(`ads-click:${ip}`, { windowMs: 60000, maxRequests: 30 })
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, reason: "rate_limit" })
    }

    await execute(
      "INSERT INTO AdClick (campaignId, placementId, userId, ip, userAgent, cost, fraudulent) VALUES (?, ?, ?, ?, ?, 0, 0)",
      [campaignId, placementId || null, userId || null, ip, ua]
    )

    const placement = await queryOne<any>("SELECT auctionEnabled FROM AdPlacement WHERE id = ?", [placementId])
    const cost = placement?.auctionEnabled ? 2 : 0

    await execute(
      "UPDATE AdCampaign SET clicks = clicks + 1, spent = spent + ?, ctr = IF(impressions > 0, (clicks / impressions) * 100, 0), avgCpc = IF(clicks > 0, spent / clicks, 0) WHERE id = ?",
      [cost, campaignId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADS_CLICK]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
