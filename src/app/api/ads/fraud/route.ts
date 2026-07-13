import { NextResponse } from "next/server"
import { queryAll, queryOne } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

const SUSPICIOUS_IPS_CACHE = new Map<string, { count: number; lastSeen: number }>()
const CLICK_THRESHOLD = 10
const WINDOW_MS = 60000

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get("campaignId")
    const action = searchParams.get("action")
    const clickId = searchParams.get("clickId")

    if (action === "mark_fraudulent" && clickId) {
      const { execute } = await import("@/lib/db")
      await execute("UPDATE AdClick SET fraudulent = 1 WHERE id = ?", [clickId])
      return NextResponse.json({ success: true })
    }

    let conditions = "WHERE cl.fraudulent = 0"
    const params: unknown[] = []

    if (campaignId) {
      conditions += " AND cl.campaignId = ?"
      params.push(campaignId)
    }

    const suspiciousClicks = await queryAll<any>(
      `SELECT cl.*, c.name as campaignName
       FROM AdClick cl
       JOIN AdCampaign c ON c.id = cl.campaignId
       ${conditions}
       ORDER BY cl.createdAt DESC
       LIMIT 50`,
      params.length ? params : undefined
    )

    const ipGroups = new Map<string, { clicks: typeof suspiciousClicks; count: number }>()
    for (const click of suspiciousClicks) {
      if (!click.ip) continue
      if (!ipGroups.has(click.ip)) ipGroups.set(click.ip, { clicks: [], count: 0 })
      ipGroups.get(click.ip)!.clicks.push(click)
      ipGroups.get(click.ip)!.count++
    }

    const fraudCandidates = []
    for (const [ip, group] of ipGroups) {
      if (group.count >= CLICK_THRESHOLD) {
        fraudCandidates.push({
          ip,
          clickCount: group.count,
          clicks: group.clicks.slice(0, 10),
          risk: group.count >= 20 ? "high" : group.count >= 15 ? "medium" : "low",
        })
      }
    }

    const recentClicks = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM AdClick WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 HOUR)"
    )

    return NextResponse.json({
      totalRecentClicks: recentClicks?.count ?? 0,
      fraudCandidates,
      flagged: fraudCandidates.length,
    })
  } catch (error) {
    console.error("[ADS_FRAUD]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
