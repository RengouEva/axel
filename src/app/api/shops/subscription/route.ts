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

async function assignSubscriptionBadges(shopId: string, plan: { hasPremiumBadge: boolean; hasVerifiedBadge: boolean; hasFeaturedBadge: boolean }) {
  const badges: { type: string; label: string; color: string; icon: string; assignedBy: string }[] = []
  if (plan.hasPremiumBadge) badges.push({ type: "premium", ...BADGE_CONFIG.premium, assignedBy: "subscription" })
  if (plan.hasVerifiedBadge) badges.push({ type: "verified", ...BADGE_CONFIG.verified, assignedBy: "subscription" })
  if (plan.hasFeaturedBadge) badges.push({ type: "featured", ...BADGE_CONFIG.featured, assignedBy: "subscription" })

  for (const badge of badges) {
    const existing = await prisma.shopBadge.findFirst({
      where: { shopId, type: badge.type },
    })
    if (!existing) {
      await prisma.shopBadge.create({
        data: { id: generateId("BDG"), shopId, ...badge },
      })
    }
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller"])
    if (!auth.success) return auth.response

    const shop = await prisma.shop.findUnique({
      where: { sellerId: auth.user.userId },
    })
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const subscription = await prisma.shopSubscription.findFirst({
      where: { shopId: shop.id, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    const boostsUsed = await prisma.productBoost.count({
      where: { shopId: shop.id, status: "active" },
    })

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        planName: subscription.plan.name,
        planDescription: subscription.plan.description,
        price: subscription.plan.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        autoRenew: subscription.autoRenew,
        badgesIncluded: (
          [
            subscription.plan.hasPremiumBadge && "Premium",
            subscription.plan.hasVerifiedBadge && "Vérifié",
            subscription.plan.hasFeaturedBadge && "Mis en avant",
          ] as (string | false)[]
        ).filter(Boolean) as string[],
        boostsIncluded: subscription.plan.maxBoosts,
        boostsUsed,
      },
    })
  } catch (error) {
    console.error("[SUBSCRIPTION_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller"])
    if (!auth.success) return auth.response

    const shop = await prisma.shop.findUnique({
      where: { sellerId: auth.user.userId },
    })
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const { planId } = await request.json()
    if (!planId || typeof planId !== "number") {
      return NextResponse.json({ error: "planId est requis" }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan non trouvé ou inactif" }, { status: 404 })
    }

    const existingSubscription = await prisma.shopSubscription.findFirst({
      where: { shopId: shop.id, status: "active" },
    })
    if (existingSubscription) {
      return NextResponse.json(
        { error: "Vous avez déjà un abonnement actif" },
        { status: 409 }
      )
    }

    const now = new Date()
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    if (plan.price > 0) {
      const transaction = await prisma.transaction.create({
        data: {
          id: generateId("TXN"),
          shopId: shop.id,
          userId: auth.user.userId,
          amount: plan.price,
          type: "subscription",
          status: "pending",
          metadata: JSON.stringify({ planId: plan.id, startDate: now.toISOString(), endDate: endDate.toISOString() }),
        },
      })

      return NextResponse.json({
        requiresPayment: true,
        transaction,
        plan,
      })
    }

    const subscription = await prisma.shopSubscription.create({
      data: {
        id: generateId("SUB"),
        shopId: shop.id,
        planId: plan.id,
        startDate: now,
        endDate,
        status: "active",
      },
    })

    await prisma.transaction.create({
      data: {
        id: generateId("TXN"),
        shopId: shop.id,
        userId: auth.user.userId,
        amount: 0,
        type: "subscription",
        status: "completed",
        metadata: JSON.stringify({ planId: plan.id, subscriptionId: subscription.id }),
      },
    })

    await assignSubscriptionBadges(shop.id, plan)

    return NextResponse.json({
      requiresPayment: false,
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        planName: plan.name,
        planDescription: plan.description,
        price: plan.price,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        autoRenew: subscription.autoRenew,
        badgesIncluded: (
          [
            plan.hasPremiumBadge && "Premium",
            plan.hasVerifiedBadge && "Vérifié",
            plan.hasFeaturedBadge && "Mis en avant",
          ] as (string | false)[]
        ).filter(Boolean) as string[],
        boostsIncluded: plan.maxBoosts,
        boostsUsed: 0,
      },
    })
  } catch (error) {
    console.error("[SUBSCRIPTION_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
