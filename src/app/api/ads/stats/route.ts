import { NextResponse } from "next/server"
import { queryOne, queryAll } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"
import { type AdSlot } from "@/lib/ads"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const period = searchParams.get("period") || "7d"
    const shopId = searchParams.get("shopId")

    if (campaignId) {
      const campaign = await queryOne<any>("SELECT id, userId FROM AdCampaign WHERE id = ?", [campaignId])
      if (!campaign) return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 })
      if (auth.user.role === "seller" && campaign.userId !== auth.user.userId) {
        return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
      }

      const impressions = await queryAll<any>(
        "SELECT DATE(createdAt) as date, COUNT(*) as count FROM AdImpression WHERE campaignId = ? GROUP BY DATE(createdAt) ORDER BY date",
        [campaignId]
      )
      const clicks = await queryAll<any>(
        "SELECT DATE(createdAt) as date, COUNT(*) as count FROM AdClick WHERE campaignId = ? GROUP BY DATE(createdAt) ORDER BY date",
        [campaignId]
      )
      const events = await queryAll<any>(
        "SELECT DATE(createdAt) as date, type, COUNT(*) as count FROM AdEvent WHERE campaignId = ? GROUP BY DATE(createdAt), type ORDER BY date",
        [campaignId]
      )

      return NextResponse.json({ impressions, clicks, events })
    }

    const interval = period === "30d" ? 30 : period === "90d" ? 90 : 7
    const userId = auth.user.userId
    const role = auth.user.role

    let whereClause = ""
    const params: unknown[] = [interval]
    if (role === "seller") {
      whereClause = "AND c.userId = ?"
      params.push(userId)
    }
    if (role === "admin" && shopId) {
      whereClause = "AND c.shopId = ?"
      params.push(shopId)
    }

    const totals = await queryOne<any>(
      `SELECT
         COUNT(*) as totalCampaigns,
         SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as activeCampaigns,
         COALESCE(SUM(c.impressions), 0) as totalImpressions,
         COALESCE(SUM(c.clicks), 0) as totalClicks,
         COALESCE(SUM(c.spent), 0) as totalSpent,
         COALESCE(SUM(c.budget), 0) as totalBudget,
         COALESCE(SUM(c.sales), 0) as totalSales,
         COALESCE(SUM(c.cartAdds), 0) as totalCartAdds
       FROM AdCampaign c
       WHERE c.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) ${whereClause}`,
      params
    )

    const byType = await queryAll<any>(
      `SELECT c.type, COUNT(*) as count, SUM(c.impressions) as impressions, SUM(c.clicks) as clicks, SUM(c.spent) as spent
       FROM AdCampaign c
       WHERE c.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY) ${whereClause}
       GROUP BY c.type`,
      params
    )

    return NextResponse.json({
      totals: {
        totalCampaigns: totals?.totalCampaigns ?? 0,
        activeCampaigns: totals?.activeCampaigns ?? 0,
        totalImpressions: totals?.totalImpressions ?? 0,
        totalClicks: totals?.totalClicks ?? 0,
        totalSpent: totals?.totalSpent ?? 0,
        totalBudget: totals?.totalBudget ?? 0,
        totalSales: totals?.totalSales ?? 0,
        totalCartAdds: totals?.totalCartAdds ?? 0,
        ctr: (totals?.totalImpressions ?? 0) > 0 ? ((totals?.totalClicks ?? 0) / (totals?.totalImpressions ?? 0) * 100).toFixed(2) : "0.00",
        spendRate: (totals?.totalBudget ?? 0) > 0 ? ((totals?.totalSpent ?? 0) / (totals?.totalBudget ?? 0) * 100).toFixed(1) : "0.0",
      },
      byType,
    })
  } catch (error) {
    console.error("[ADS_STATS]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
