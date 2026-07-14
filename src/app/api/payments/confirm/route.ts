import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  premium: { label: "Premium", color: "#FFD700", icon: "crown" },
  verified: { label: "Vérifié", color: "#1DA1F2", icon: "verified" },
  featured: { label: "En vedette", color: "#FF6B35", icon: "star" },
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
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

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    let { transactionId, reference } = body

    if (!transactionId && !reference) {
      if (body.paymentId) transactionId = body.paymentId
      if (body.planId && body.type) {
        const shop = await queryOne<any>(
          "SELECT id FROM Shop WHERE sellerId = ? LIMIT 1",
          [auth.user.userId]
        )
        if (shop) {
          const txn = await queryOne<any>(
            "SELECT id FROM `Transaction` WHERE shopId = ? AND type = ? AND status = 'pending' ORDER BY createdAt DESC LIMIT 1",
            [shop.id, body.type]
          )
          if (txn) transactionId = txn.id
        }
      }
    }

    if (!transactionId && !reference) {
      return NextResponse.json({ error: "transactionId ou reference est requis" }, { status: 400 })
    }

    const transaction = transactionId
      ? await queryOne<any>("SELECT * FROM `Transaction` WHERE id = ?", [transactionId])
      : await queryOne<any>("SELECT * FROM `Transaction` WHERE reference = ? LIMIT 1", [reference])

    if (!transaction) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 })
    }

    if (transaction.status !== "pending") {
      if (transaction.status === "completed") {
        return NextResponse.json({ success: true, transaction: { ...transaction, status: "completed" } })
      }
      return NextResponse.json({ error: "Cette transaction a déjà été traitée" }, { status: 400 })
    }

    await execute("UPDATE `Transaction` SET status = 'completed' WHERE id = ?", [transaction.id])

    if (transaction.type === "subscription" && transaction.metadata) {
      const meta = JSON.parse(transaction.metadata)
      const pendingSubscription = await queryOne<any>(
        `SELECT sub.*, p.id as _plan_id, p.name as _plan_name, p.durationDays as _plan_durationDays, p.hasPremiumBadge, p.hasVerifiedBadge, p.hasFeaturedBadge
         FROM ShopSubscription sub JOIN Plan p ON p.id = sub.planId
         WHERE sub.shopId = ? AND sub.planId = ? AND sub.status = 'pending'
         ORDER BY sub.createdAt DESC LIMIT 1`,
        [transaction.shopId, meta.planId]
      )

      if (pendingSubscription) {
        const now = new Date()
        const endDate = new Date(now.getTime() + pendingSubscription._plan_durationDays * 24 * 60 * 60 * 1000)

        await execute(
          "UPDATE ShopSubscription SET status = 'active', startDate = ?, endDate = ? WHERE id = ?",
          [now, endDate, pendingSubscription.id]
        )

        await assignSubscriptionBadges(pendingSubscription.shopId, {
          hasPremiumBadge: pendingSubscription.hasPremiumBadge,
          hasVerifiedBadge: pendingSubscription.hasVerifiedBadge,
          hasFeaturedBadge: pendingSubscription.hasFeaturedBadge,
        })
      } else if (meta.planId && transaction.shopId) {
        const plan = await queryOne<any>("SELECT * FROM Plan WHERE id = ?", [meta.planId])
        if (plan) {
          const now = new Date()
          const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

          await execute(
            "INSERT INTO ShopSubscription (id, shopId, planId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)",
            [generateId("SUB"), transaction.shopId, plan.id, now, endDate, "active"]
          )

          await assignSubscriptionBadges(transaction.shopId, plan)
        }
      }
    }

    if (transaction.type === "boost" && transaction.metadata) {
      const meta = JSON.parse(transaction.metadata)
      const pendingBoost = await queryOne<any>(
        "SELECT id FROM ProductBoost WHERE shopId = ? AND productId = ? AND status = 'pending' ORDER BY createdAt DESC LIMIT 1",
        [transaction.shopId, meta.productId]
      )

      if (pendingBoost) {
        await execute("UPDATE ProductBoost SET status = 'active' WHERE id = ?", [pendingBoost.id])
      }
    }

    return NextResponse.json({ success: true, transaction: { ...transaction, status: "completed" } })
  } catch (error) {
    console.error("[PAYMENT_CONFIRM]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
