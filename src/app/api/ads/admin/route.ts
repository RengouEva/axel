import { NextResponse } from "next/server"
import { queryAll, queryOne, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "overview"

    if (action === "overview") {
      const totals = await queryOne<any>(
        `SELECT
          COUNT(*) as totalCampaigns,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCampaigns,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCampaigns,
          COALESCE(SUM(impressions), 0) as totalImpressions,
          COALESCE(SUM(clicks), 0) as totalClicks,
          COALESCE(SUM(spent), 0) as totalSpent,
          COALESCE(SUM(budget), 0) as totalBudget,
          COALESCE(SUM(sales), 0) as totalSales
         FROM AdCampaign`
      )

      const revenue = await queryOne<{ total: number }>(
        "SELECT COALESCE(SUM(amount), 0) as total FROM `Transaction` WHERE type = 'ad' AND status = 'completed'"
      )

      const activePlacements = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM AdPlacement WHERE isActive = 1"
      )

      const fraudCount = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM AdClick WHERE fraudulent = 1"
      )

      const topCampaigns = await queryAll<any>(
        `SELECT c.id, c.name, c.type, c.status, c.spent, c.impressions, c.clicks, c.roi,
                s.name as shopName
         FROM AdCampaign c
         JOIN Shop s ON s.id = c.shopId
         ORDER BY c.spent DESC
         LIMIT 10`
      )

      const clicksByDay = await queryAll<any>(
        `SELECT DATE(createdAt) as date, COUNT(*) as count
         FROM AdClick WHERE fraudulent = 0 AND createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY)
         GROUP BY DATE(createdAt) ORDER BY date`
      )

      return NextResponse.json({
        totals,
        revenue: revenue?.total ?? 0,
        activePlacements: activePlacements?.count ?? 0,
        fraudCount: fraudCount?.count ?? 0,
        topCampaigns,
        clicksByDay,
      })
    }

    if (action === "approve" || action === "reject") {
      const campaignId = searchParams.get("campaignId")
      if (!campaignId) return NextResponse.json({ error: "Campagne ID requis" }, { status: 400 })

      const newStatus = action === "approve" ? "active" : "rejected"
      await execute("UPDATE AdCampaign SET status = ?, approvedAt = NOW(), approvedBy = ? WHERE id = ?",
        [newStatus, auth.user.userId, campaignId])

      if (newStatus === "active") {
        await execute(
          "INSERT INTO AdCampaignNotification (id, campaignId, userId, type, title, message) VALUES (?, ?, ?, 'started', 'Campagne approuvée', 'Votre campagne a été approuvée et est maintenant en diffusion.')",
          [campaignId + "-NOTIF", campaignId, 0]
        )
      }

      return NextResponse.json({ success: true, status: newStatus })
    }

    if (action === "suspend") {
      const campaignId = searchParams.get("campaignId")
      if (!campaignId) return NextResponse.json({ error: "Campagne ID requis" }, { status: 400 })

      await execute("UPDATE AdCampaign SET status = 'paused' WHERE id = ?", [campaignId])
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  } catch (error) {
    console.error("[ADS_ADMIN]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
