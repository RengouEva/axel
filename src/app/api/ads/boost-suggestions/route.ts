import { NextResponse } from "next/server"
import { queryAll, queryOne } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

interface BoostSuggestion {
  productId: number
  productName: string
  productImage: string
  productPrice: number
  score: number
  reasons: string[]
  metrics: {
    views30: number
    clicks30: number
    cartAdds30: number
    purchases30: number
    ctr: number
    conversionRate: number
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const shopId = searchParams.get("shopId")

    if (!shopId) {
      return NextResponse.json({ error: "shopId requis" }, { status: 400 })
    }

    const shop = await queryOne<any>("SELECT id, sellerId FROM Shop WHERE id = ?", [shopId])
    if (!shop || (auth.user.role !== "admin" && shop.sellerId !== auth.user.userId)) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }

    const now = new Date()

    const products = await queryAll<any>(
      `SELECT id, name, image, price, rating, createdAt, updatedAt, inStock
       FROM Product WHERE shopId = ? ORDER BY createdAt DESC`,
      [shopId]
    )

    if (products.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const productIds = products.map((p: any) => p.id)

    const activeBoostProductIds = new Set<number>()
    const boosts = await queryAll<{ productId: number }>(
      `SELECT productId FROM ProductBoost
       WHERE productId IN (${productIds.map(() => "?").join(",")})
       AND status = 'active' AND startDate <= ? AND endDate >= ?`,
      [...productIds, now, now]
    )
    boosts.forEach((b: any) => activeBoostProductIds.add(b.productId))

    const events = await queryAll<any>(
      `SELECT productId, event, COUNT(*) as count
       FROM ProductEvent
       WHERE productId IN (${productIds.map(() => "?").join(",")})
       AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY productId, event`,
      productIds
    )

    const eventMap: Record<number, Record<string, number>> = {}
    for (const ev of events) {
      if (!eventMap[ev.productId]) eventMap[ev.productId] = { view: 0, click: 0, cart_add: 0, purchase: 0, favorite: 0 }
      eventMap[ev.productId][ev.event] = ev.count
    }

    const suggestions: BoostSuggestion[] = []

    for (const p of products) {
      if (activeBoostProductIds.has(p.id)) continue
      if (!p.inStock) continue

      const m = eventMap[p.id] || { view: 0, click: 0, cart_add: 0, purchase: 0, favorite: 0 }
      const views = m.view || 0
      const clicks = m.click || 0
      const cartAdds = m.cart_add || 0
      const purchases = m.purchase || 0
      const ctr = views > 0 ? (clicks / views) * 100 : 0
      const conversionRate = views > 0 ? (purchases / views) * 100 : 0

      let score = 0
      const reasons: string[] = []

      if (views >= 50) {
        score += 25
        reasons.push(`${views} vues en 30 jours`)
      } else if (views >= 10) {
        score += 10
        reasons.push(`${views} vues en 30 jours`)
      }

      if (ctr > 5) {
        score += 20
        reasons.push(`Bon taux d'engagement (${ctr.toFixed(1)}% clics)`)
      } else if (ctr > 2) {
        score += 10
      }

      if (cartAdds >= 5) {
        score += 20
        reasons.push(`${cartAdds} ajouts au panier`)
      } else if (cartAdds >= 2) {
        score += 10
      }

      if (conversionRate > 2) {
        score += 20
        reasons.push(`Taux de conversion élevé (${conversionRate.toFixed(1)}%)`)
      } else if (purchases > 0) {
        score += 10
        reasons.push(`${purchases} vente(s) réalisée(s)`)
      }

      if (p.rating >= 4) {
        score += 15
        reasons.push(`Note élevée (${p.rating}/5)`)
      } else if (p.rating >= 3) {
        score += 5
      }

      if (p.updatedAt) {
        const daysSinceUpdate = Math.floor((now.getTime() - new Date(p.updatedAt).getTime()) / 86400000)
        if (daysSinceUpdate <= 7) {
          score += 10
          reasons.push("Produit récemment mis à jour")
        }
      }

      if (score > 0) {
        suggestions.push({
          productId: p.id,
          productName: p.name,
          productImage: p.image,
          productPrice: p.price,
          score,
          reasons,
          metrics: {
            views30: views,
            clicks30: clicks,
            cartAdds30: cartAdds,
            purchases30: purchases,
            ctr,
            conversionRate,
          },
        })
      }
    }

    suggestions.sort((a, b) => b.score - a.score)

    return NextResponse.json({ suggestions: suggestions.slice(0, 5) })
  } catch (error) {
    console.error("[BOOST_SUGGESTIONS]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
