import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const shop = await prisma.shop.findUnique({ where: { id } })
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

    await prisma.transaction.create({
      data: {
        id: generateId("TXN"),
        shopId: shop.id,
        userId: auth.user.userId,
        amount: 0,
        type: "manual",
        status: "completed",
        metadata: JSON.stringify({ assignedBy: auth.user.userId, planId, assignBadges }),
      },
    })

    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } })
      if (!plan) {
        return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
      }

      const now = new Date()
      const endDate = new Date(now.getTime() + (durationDays || plan.durationDays) * 24 * 60 * 60 * 1000)

      await prisma.shopSubscription.create({
        data: {
          id: generateId("SUB"),
          shopId: shop.id,
          planId: plan.id,
          startDate: now,
          endDate,
          status: "active",
        },
      })
    }

    if (badgesToAssign.length > 0) {
      for (const badgeType of badgesToAssign) {
        const config = BADGE_CONFIG[badgeType]
        if (!config) continue

        const existing = await prisma.shopBadge.findFirst({
          where: { shopId: shop.id, type: badgeType },
        })
        if (!existing) {
          await prisma.shopBadge.create({
            data: {
              id: generateId("BDG"),
              shopId: shop.id,
              type: badgeType,
              label: config.label,
              color: config.color,
              icon: config.icon,
              assignedBy: "admin",
            },
          })
        }
      }
    }

    const updatedShop = await prisma.shop.findUnique({
      where: { id },
      include: { badges: true, subscriptions: { where: { status: "active" } } },
    })

    return NextResponse.json(updatedShop)
  } catch (error) {
    console.error("[ADMIN_SHOP_PREMIUM]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
