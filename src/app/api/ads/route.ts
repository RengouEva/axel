import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"
import { checkApiRateLimit } from "@/lib/rate-limit"
import { generateId, type CampaignType } from "@/lib/ads"
import { validateInput, adCampaignCreateSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const shopId = searchParams.get("shopId")
    const userId = auth.user.userId
    const userRole = auth.user.role

    const conditions: string[] = []
    const params: unknown[] = []

    if (userRole === "seller") {
      conditions.push("c.userId = ?")
      params.push(userId)
    }
    if (status && status !== "all") {
      conditions.push("c.status = ?")
      params.push(status)
    }
    if (type && type !== "all") {
      conditions.push("c.type = ?")
      params.push(type)
    }
    if (shopId) {
      conditions.push("c.shopId = ?")
      params.push(shopId)
    }
    const whereSQL = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""

    const campaigns = await queryAll<any>(
      `SELECT c.*, p.id as _product_id, p.name as _product_name, p.image as _product_image, p.price as _product_price,
        s.id as _shop_id, s.name as _shop_name, s.slug as _shop_slug, s.logo as _shop_logo
       FROM AdCampaign c
       LEFT JOIN Product p ON p.id = c.productId
       LEFT JOIN Shop s ON s.id = c.shopId
       ${whereSQL}
       ORDER BY c.createdAt DESC`
    )

    const formatted = await Promise.all(campaigns.map(async (c: any) => {
      const placements = await queryAll<any>(
        `SELECT ap.id, ap.slot, acp.bid
         FROM AdCampaignPlacement acp
         JOIN AdPlacement ap ON ap.id = acp.placementId
         WHERE acp.campaignId = ?`,
        [c.id]
      )
      return {
        ...c,
        product: c._product_id ? { id: c._product_id, name: c._product_name, image: c._product_image, price: c._product_price } : null,
        shop: c._shop_id ? { id: c._shop_id, name: c._shop_name, slug: c._shop_slug, logo: c._shop_logo } : null,
        placements: placements.map((p: any) => ({ id: p.id, slot: p.slot, bid: p.bid })),
        _product_id: undefined, _product_name: undefined, _product_image: undefined, _product_price: undefined,
        _shop_id: undefined, _shop_name: undefined, _shop_slug: undefined, _shop_logo: undefined,
      }
    }))

    return NextResponse.json({ campaigns: formatted })
  } catch (error) {
    console.error("[ADS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`ads-create:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateInput(adCampaignCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { shopId, name, type, objective, budget, startDate, endDate, dailyBudget,
      targetCountry, targetCity, targetCategory, productId,
      bannerImage, bannerUrl, placements: selectedPlacements,
      isBooster, durationDays } = validation.data

    const shop = await queryOne<any>("SELECT id, sellerId FROM Shop WHERE id = ?", [shopId])
    if (!shop || shop.sellerId !== auth.user.userId) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }

    const campaignId = generateId("AD")
    const status = isBooster ? "active" : "pending"
    const actualStartDate = isBooster ? new Date().toISOString() : startDate
    let actualEndDate = endDate
    if (isBooster && durationDays) {
      const d = new Date()
      d.setDate(d.getDate() + Number(durationDays))
      actualEndDate = d.toISOString()
    }

    await execute(
      `INSERT INTO AdCampaign (id, shopId, userId, name, type, objective, status, budget, spent, startDate, endDate, dailyBudget,
        targetCountry, targetCity, targetCategory, productId, bannerImage, bannerUrl)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [campaignId, shopId, auth.user.userId, name, type, objective || "visibility", status,
       budget || 0, actualStartDate, actualEndDate, dailyBudget || 0,
       targetCountry || null, targetCity || null, targetCategory || null,
       productId || null, bannerImage || null, bannerUrl || null]
    )

    if (selectedPlacements && Array.isArray(selectedPlacements)) {
      for (const p of selectedPlacements) {
        const placement = await queryOne<any>("SELECT id FROM AdPlacement WHERE id = ?", [p.id])
        if (placement) {
          await execute(
            "INSERT INTO AdCampaignPlacement (campaignId, placementId, bid) VALUES (?, ?, ?)",
            [campaignId, p.id, p.bid || 0]
          )
        }
      }
    }

    if (isBooster) {
      await execute(
        "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [generateId("TXN"), shopId, auth.user.userId, 0, "ad", "completed",
         JSON.stringify({ campaignId, booster: true, durationDays, assignedBy: "system" })]
      )
    }

    const campaign = await queryOne<any>("SELECT * FROM AdCampaign WHERE id = ?", [campaignId])

    return NextResponse.json({ campaign, status: isBooster ? "active" : "pending" }, { status: 201 })
  } catch (error) {
    console.error("[ADS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
