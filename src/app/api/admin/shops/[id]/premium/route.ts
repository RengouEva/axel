import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  premium: { label: "Premium", color: "#FFD700", icon: "crown" },
  verified: { label: "Vérifié", color: "#1DA1F2", icon: "verified" },
  featured: { label: "En vedette", color: "#FF6B35", icon: "star" },
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params

    const shop = await queryOne<any>("SELECT id FROM Shop WHERE id = ?", [id])
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }

    const body = await request.json()
    const { planId, durationDays, assignBadges, hasPremiumBadge, hasVerifiedBadge, hasFeaturedBadge } = body as {
      planId?: number
      durationDays?: number
      assignBadges?: string[]
      hasPremiumBadge?: boolean
      hasVerifiedBadge?: boolean
      hasFeaturedBadge?: boolean
    }

    const badgesToAssign = assignBadges ?? []
    if (hasPremiumBadge) badgesToAssign.push("premium")
    if (hasVerifiedBadge) badgesToAssign.push("verified")
    if (hasFeaturedBadge) badgesToAssign.push("featured")

    await execute(
      "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [generateId("TXN"), shop.id, auth.user.userId, 0, "manual", "completed", JSON.stringify({ assignedBy: auth.user.userId, planId, assignBadges })]
    )

    if (planId) {
      const plan = await queryOne<any>("SELECT * FROM Plan WHERE id = ?", [planId])
      if (!plan) {
        return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
      }

      const now = new Date()
      const endDate = new Date(now.getTime() + (durationDays || plan.durationDays) * 24 * 60 * 60 * 1000)

      await execute(
        "INSERT INTO ShopSubscription (id, shopId, planId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)",
        [generateId("SUB"), shop.id, plan.id, now, endDate, "active"]
      )
    }

    if (badgesToAssign.length > 0) {
      for (const badgeType of badgesToAssign) {
        const config = BADGE_CONFIG[badgeType]
        if (!config) continue

        const existing = await queryOne<any>(
          "SELECT id FROM ShopBadge WHERE shopId = ? AND type = ? LIMIT 1",
          [shop.id, badgeType]
        )
        if (!existing) {
          await execute(
            "INSERT INTO ShopBadge (id, shopId, type, label, color, icon, assignedBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [generateId("BDG"), shop.id, badgeType, config.label, config.color, config.icon, "admin"]
          )
        }
      }
    }

    const updatedShop = await queryOne<any>("SELECT * FROM Shop WHERE id = ?", [id])
    const badges = await queryAll<any>("SELECT * FROM ShopBadge WHERE shopId = ?", [id])
    const subscriptions = await queryAll<any>(
      "SELECT * FROM ShopSubscription WHERE shopId = ? AND status = 'active'",
      [id]
    )
    updatedShop.badges = badges
    updatedShop.subscriptions = subscriptions

    return NextResponse.json(updatedShop)
  } catch (error) {
    console.error("[ADMIN_SHOP_PREMIUM]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
