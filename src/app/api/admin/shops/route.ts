import { NextResponse } from "next/server"
import { queryOne, queryAll } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")

    const conditions: string[] = []
    const params: unknown[] = []
    if (sellerId) {
      conditions.push("s.sellerId = ?")
      params.push(Number(sellerId))
    }
    const whereSQL = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""

    const shops = await queryAll<any>(
      `SELECT s.*, u.id as _ownerId, u.name as _ownerName, u.email as _ownerEmail
       FROM Shop s LEFT JOIN User u ON u.id = s.sellerId ${whereSQL} ORDER BY s.createdAt DESC`,
      params
    )

    const shopIds = shops.map((s: any) => s.id)
    let activeSubs: any[] = []
    let badgesList: any[] = []

    if (shopIds.length > 0) {
      const placeholders = shopIds.map(() => "?").join(",")
      activeSubs = await queryAll<any>(
        `SELECT sub.*, p.id as _plan_id, p.name as _plan_name, p.slug as _plan_slug, p.price as _plan_price, p.durationDays as _plan_durationDays
         FROM ShopSubscription sub LEFT JOIN Plan p ON p.id = sub.planId
         WHERE sub.shopId IN (${placeholders}) AND sub.status = 'active'
         ORDER BY sub.createdAt DESC`,
        shopIds
      )
      badgesList = await queryAll<any>(
        `SELECT shopId, type, label, color, icon FROM ShopBadge WHERE shopId IN (${placeholders})`,
        shopIds
      )
    }

    const subByShop: Record<string, any> = {}
    for (const sub of activeSubs) {
      if (!subByShop[sub.shopId]) {
        subByShop[sub.shopId] = { ...sub, plan: { id: sub._plan_id, name: sub._plan_name, slug: sub._plan_slug, price: sub._plan_price, durationDays: sub._plan_durationDays } }
        delete subByShop[sub.shopId]._plan_id; delete subByShop[sub.shopId]._plan_name; delete subByShop[sub.shopId]._plan_slug; delete subByShop[sub.shopId]._plan_price; delete subByShop[sub.shopId]._plan_durationDays
      }
    }

    const badgesByShop: Record<string, any[]> = {}
    for (const b of badgesList) {
      if (!badgesByShop[b.shopId]) badgesByShop[b.shopId] = []
      badgesByShop[b.shopId].push({ type: b.type, label: b.label, color: b.color, icon: b.icon })
    }

    const formatted = shops.map((shop: any) => {
      const activeSub = subByShop[shop.id] || null
      return {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        ownerName: shop._ownerName,
        ownerEmail: shop._ownerEmail,
        subscription: activeSub
          ? {
              plan: {
                id: activeSub.plan.id,
                name: activeSub.plan.name,
                slug: activeSub.plan.slug,
                price: activeSub.plan.price,
                durationDays: activeSub.plan.durationDays,
              },
              status: activeSub.status,
              endDate: activeSub.endDate,
              badges: (badgesByShop[shop.id] || []).map((b: any) => b.type),
            }
          : null,
      }
    })

    return NextResponse.json({ shops: formatted })
  } catch (error) {
    console.error("[ADMIN_SHOPS_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
