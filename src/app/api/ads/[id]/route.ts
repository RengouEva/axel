import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"
import { validateInput, adCampaignUpdateSchema } from "@/lib/validations"
import { checkApiRateLimit } from "@/lib/rate-limit"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const { id } = await params

    const campaign = await queryOne<any>(
      `SELECT c.*, p.id as _product_id, p.name as _product_name, p.image as _product_image, p.price as _product_price,
        s.id as _shop_id, s.name as _shop_name, s.slug as _shop_slug, s.logo as _shop_logo
       FROM AdCampaign c
       LEFT JOIN Product p ON p.id = c.productId
       LEFT JOIN Shop s ON s.id = c.shopId
       WHERE c.id = ?`,
      [id]
    )

    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 })
    }

    if (auth.user.role === "seller" && campaign.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const placements = await queryAll<any>(
      `SELECT ap.id, ap.slot, ap.name, acp.bid
       FROM AdCampaignPlacement acp
       JOIN AdPlacement ap ON ap.id = acp.placementId
       WHERE acp.campaignId = ?`,
      [id]
    )

    const recentImpressions = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM AdImpression WHERE campaignId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
      [id]
    )

    campaign.product = campaign._product_id
      ? { id: campaign._product_id, name: campaign._product_name, image: campaign._product_image, price: campaign._product_price }
      : null
    campaign.shop = campaign._shop_id
      ? { id: campaign._shop_id, name: campaign._shop_name, slug: campaign._shop_slug, logo: campaign._shop_logo }
      : null
    campaign.placements = placements.map((p: any) => ({ id: p.id, slot: p.slot, name: p.name, bid: p.bid }))
    campaign.recentImpressions = recentImpressions?.count ?? 0
    delete campaign._product_id; delete campaign._product_name; delete campaign._product_image; delete campaign._product_price
    delete campaign._shop_id; delete campaign._shop_name; delete campaign._shop_slug; delete campaign._shop_logo

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("[ADS_GET_ID]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const { id } = await params
    const body = await request.json()
    const validation = validateInput(adCampaignUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const campaign = await queryOne<any>("SELECT * FROM AdCampaign WHERE id = ?", [id])
    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 })
    }

    if (auth.user.role === "seller" && campaign.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const updates: string[] = []
    const updateParams: unknown[] = []
    const allowedFields: (keyof typeof validation.data)[] = [
      "name", "objective", "budget", "dailyBudget", "startDate", "endDate",
      "targetCountry", "targetCity", "targetCategory", "productId",
      "bannerImage", "bannerUrl",
    ]

    for (const field of allowedFields) {
      if (validation.data[field] !== undefined) {
        updates.push(`${field} = ?`)
        updateParams.push(validation.data[field])
      }
    }

    if (validation.data.status && ["active", "paused", "cancelled"].includes(validation.data.status)) {
      updates.push("status = ?")
      updateParams.push(validation.data.status)
    }

    if (updates.length > 0) {
      updateParams.push(id)
      await execute(`UPDATE AdCampaign SET ${updates.join(", ")} WHERE id = ?`, updateParams)
    }

    const updated = await queryOne<any>("SELECT * FROM AdCampaign WHERE id = ?", [id])
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[ADS_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const { id } = await params

    const campaign = await queryOne<any>("SELECT * FROM AdCampaign WHERE id = ?", [id])
    if (!campaign) {
      return NextResponse.json({ error: "Campagne non trouvée" }, { status: 404 })
    }

    if (auth.user.role === "seller" && campaign.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    await execute("DELETE FROM AdCampaign WHERE id = ?", [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADS_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
