import { NextResponse } from "next/server"
import { queryOne, queryAll } from "@/lib/db"
import { checkApiRateLimit, checkRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slot = searchParams.get("slot")
    const country = searchParams.get("country")
    const category = searchParams.get("category")
    const city = searchParams.get("city")
    const limit = Math.min(Number(searchParams.get("limit")) || 3, 10)
    const excludeIds = searchParams.get("exclude")?.split(",").filter(Boolean) || []

    if (!slot) {
      return NextResponse.json({ error: "Paramètre 'slot' requis" }, { status: 400 })
    }

    const placement = await queryOne<any>("SELECT id, slot, auctionEnabled, basePrice FROM AdPlacement WHERE slot = ? AND isActive = 1", [slot])
    if (!placement) {
      return NextResponse.json({ ads: [] })
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`ads-serve:${ip}:${slot}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ ads: [] })
    }

    const conditions: string[] = [
      "c.status = 'active'",
      "c.startDate <= NOW()",
      "c.endDate >= NOW()",
      "c.spent < c.budget OR c.budget = 0",
    ]
    const params: unknown[] = []
    params.push(placement.id)

    if (placement.auctionEnabled) {
      conditions.push("acp.placementId = ?")
    } else {
      const exactSlot = placement.id
      conditions.push("acp.placementId = ?")
    }

    if (country) {
      conditions.push("(c.targetCountry IS NULL OR c.targetCountry = ?)")
      params.push(country)
    }
    if (category) {
      conditions.push("(c.targetCategory IS NULL OR c.targetCategory = ?)")
      params.push(category)
    }
    if (city) {
      conditions.push("(c.targetCity IS NULL OR c.targetCity = ?)")
      params.push(city)
    }

    const now = new Date()
    const hourKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}`
    const rateLimitHourKey = checkRateLimit(`ads-serve-${slot}:${hourKey}`, { windowMs: 3600000, maxRequests: 1000 })
    if (!rateLimitHourKey.allowed) {
      return NextResponse.json({ ads: [] })
    }

    let ads: any[]
    if (placement.auctionEnabled) {
      ads = await queryAll<any>(
        `SELECT c.*, acp.bid, p.id as _pid, p.name as _pname, p.image as _pimage, p.price as _pprice,
                s.id as _sid, s.name as _sname, s.slug as _sslug, s.logo as _slogo
         FROM AdCampaign c
         JOIN AdCampaignPlacement acp ON acp.campaignId = c.id
         LEFT JOIN Product p ON p.id = c.productId
         LEFT JOIN Shop s ON s.id = c.shopId
         WHERE ${conditions.join(" AND ")}
         ORDER BY (c.qualityScore * (c.budget - c.spent) / GREATEST(c.budget, 1)) DESC
         LIMIT ?`,
        [...params, limit]
      )
    } else {
      ads = await queryAll<any>(
        `SELECT c.*, 0 as bid, p.id as _pid, p.name as _pname, p.image as _pimage, p.price as _pprice,
                s.id as _sid, s.name as _sname, s.slug as _sslug, s.logo as _slogo
         FROM AdCampaign c
         JOIN AdCampaignPlacement acp ON acp.campaignId = c.id
         LEFT JOIN Product p ON p.id = c.productId
         LEFT JOIN Shop s ON s.id = c.shopId
         WHERE ${conditions.join(" AND ")}
         ORDER BY RAND()
         LIMIT ?`,
        [...params, limit]
      )
    }

    if (excludeIds.length > 0) {
      ads = ads.filter((a: any) => !excludeIds.includes(String(a.productId)))
    }

    const sessionId = crypto.randomUUID?.() || Math.random().toString(36).substring(2)

    const formatted = ads.map((a: any) => ({
      id: a.id,
      type: a.type,
      product: a._pid ? { id: a._pid, name: a._pname, image: a._pimage, price: a._pprice } : null,
      shop: a._sid ? { id: a._sid, name: a._sname, slug: a._sslug, logo: a._slogo } : null,
      bannerImage: a.bannerImage,
      bannerUrl: a.bannerUrl,
      targetUrl: a.type === "sponsored_product" && a._pid ? `/product/${a._pid}` :
                 a.type === "sponsored_shop" && a._sid ? `/shop/${a._sslug}` :
                 a.bannerUrl || "#",
      placementId: placement.id,
      sessionId,
    }))

    if (formatted.length > 0) {
      const insertValues = formatted.map((a: any) =>
        `('${a.id}', '${placement.id}', NULL, '${sessionId}', '${ip}', '', 0, 1, NOW())`
      ).join(",")
      try {
        const { execute } = await import("@/lib/db")
        const costPerAd = placement.auctionEnabled ? 1 : 0
        await execute(
          `INSERT INTO AdImpression (campaignId, placementId, userId, sessionId, ip, userAgent, cost, weighted, createdAt) VALUES ${insertValues}`
        )
        for (const a of formatted) {
          await execute(
            `UPDATE AdCampaign SET impressions = impressions + 1, spent = spent + ? WHERE id = ?`,
            [costPerAd, a.id]
          )
        }
      } catch (e) {
        console.error("[ADS_IMPRESSION_LOG]", e)
      }
    }

    return NextResponse.json({ ads: formatted, placement: { id: placement.id, slot: placement.slot } })
  } catch (error) {
    console.error("[ADS_SERVE]", error)
    return NextResponse.json({ ads: [] })
  }
}
