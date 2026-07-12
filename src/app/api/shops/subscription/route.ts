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

async function assignSubscriptionBadges(shopId: string, plan: { hasPremiumBadge: boolean; hasVerifiedBadge: boolean; hasFeaturedBadge: boolean }) {
  const badges: { type: string; label: string; color: string; icon: string; assignedBy: string }[] = []
  if (plan.hasPremiumBadge) badges.push({ type: "premium", ...BADGE_CONFIG.premium, assignedBy: "subscription" })
  if (plan.hasVerifiedBadge) badges.push({ type: "verified", ...BADGE_CONFIG.verified, assignedBy: "subscription" })
  if (plan.hasFeaturedBadge) badges.push({ type: "featured", ...BADGE_CONFIG.featured, assignedBy: "subscription" })

  for (const badge of badges) {
    const existing = await queryOne<any>(
      "SELECT id FROM ShopBadge WHERE shopId = ? AND type = ? LIMIT 1",
      [shopId, badge.type]
    )
    if (!existing) {
      await execute(
        "INSERT INTO ShopBadge (id, shopId, type, label, color, icon, assignedBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [generateId("BDG"), shopId, badge.type, badge.label, badge.color, badge.icon, badge.assignedBy]
      )
    }
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT id FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const subscription = await queryOne<any>(
      `SELECT sub.*, p.*, p.id as _plan_id
       FROM ShopSubscription sub JOIN Plan p ON p.id = sub.planId
       WHERE sub.shopId = ? AND sub.status = 'active' ORDER BY sub.createdAt DESC LIMIT 1`,
      [shop.id]
    )

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    const boostsUsedRow = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM ProductBoost WHERE shopId = ? AND status = 'active'",
      [shop.id]
    )

    const plan = {
      id: subscription._plan_id,
      name: subscription.name,
      description: subscription.description,
      price: subscription.price,
      durationDays: subscription.durationDays,
      maxBoosts: subscription.maxBoosts,
      hasPremiumBadge: subscription.hasPremiumBadge,
      hasVerifiedBadge: subscription.hasVerifiedBadge,
      hasFeaturedBadge: subscription.hasFeaturedBadge,
    }

    return NextResponse.json({
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
        boostsUsed: boostsUsedRow?.count ?? 0,
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

    const shop = await queryOne<any>("SELECT id FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const { planId } = await request.json()
    if (!planId || typeof planId !== "number") {
      return NextResponse.json({ error: "planId est requis" }, { status: 400 })
    }

    const plan = await queryOne<any>("SELECT * FROM Plan WHERE id = ?", [planId])
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan non trouvé ou inactif" }, { status: 404 })
    }

    const existingSubscription = await queryOne<any>(
      "SELECT id FROM ShopSubscription WHERE shopId = ? AND status = 'active' LIMIT 1",
      [shop.id]
    )
    if (existingSubscription) {
      return NextResponse.json(
        { error: "Vous avez déjà un abonnement actif" },
        { status: 409 }
      )
    }

    const now = new Date()
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    if (plan.price > 0) {
      const txnId = generateId("TXN")
      await execute(
        "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [txnId, shop.id, auth.user.userId, plan.price, "subscription", "pending",
         JSON.stringify({ planId: plan.id, startDate: now.toISOString(), endDate: endDate.toISOString() })]
      )
      const transaction = await queryOne<any>("SELECT * FROM Transaction WHERE id = ?", [txnId])

      return NextResponse.json({
        requiresPayment: true,
        transaction,
        plan,
      })
    }

    const subId = generateId("SUB")
    await execute(
      "INSERT INTO ShopSubscription (id, shopId, planId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)",
      [subId, shop.id, plan.id, now, endDate, "active"]
    )
    const subscription = await queryOne<any>("SELECT * FROM ShopSubscription WHERE id = ?", [subId])

    await execute(
      "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [generateId("TXN"), shop.id, auth.user.userId, 0, "subscription", "completed",
       JSON.stringify({ planId: plan.id, subscriptionId: subscription.id })]
    )

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
