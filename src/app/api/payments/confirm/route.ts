import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { transactionId, reference } = body

    if (!transactionId && !reference) {
      return NextResponse.json({ error: "transactionId ou reference est requis" }, { status: 400 })
    }

    const transaction = transactionId
      ? await prisma.transaction.findUnique({ where: { id: transactionId } })
      : await prisma.transaction.findFirst({ where: { reference } })

    if (!transaction) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ error: "Cette transaction a déjà été traitée" }, { status: 400 })
    }

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "completed" },
    })

    if (transaction.type === "subscription" && transaction.metadata) {
      const meta = JSON.parse(transaction.metadata)
      const pendingSubscription = await prisma.shopSubscription.findFirst({
        where: {
          shopId: transaction.shopId!,
          planId: meta.planId,
          status: "pending",
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      })

      if (pendingSubscription) {
        const now = new Date()
        const endDate = new Date(now.getTime() + pendingSubscription.plan.durationDays * 24 * 60 * 60 * 1000)

        await prisma.shopSubscription.update({
          where: { id: pendingSubscription.id },
          data: { status: "active", startDate: now, endDate },
        })

        await assignSubscriptionBadges(pendingSubscription.shopId, pendingSubscription.plan)
      } else if (meta.planId && transaction.shopId) {
        const plan = await prisma.plan.findUnique({ where: { id: meta.planId } })
        if (plan) {
          const now = new Date()
          const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

          const subscription = await prisma.shopSubscription.create({
            data: {
              id: generateId("SUB"),
              shopId: transaction.shopId,
              planId: plan.id,
              startDate: now,
              endDate,
              status: "active",
            },
          })

          await assignSubscriptionBadges(transaction.shopId, plan)
        }
      }
    }

    if (transaction.type === "boost" && transaction.metadata) {
      const meta = JSON.parse(transaction.metadata)
      const pendingBoost = await prisma.productBoost.findFirst({
        where: {
          shopId: transaction.shopId!,
          productId: meta.productId,
          status: "pending",
        },
        orderBy: { createdAt: "desc" },
      })

      if (pendingBoost) {
        await prisma.productBoost.update({
          where: { id: pendingBoost.id },
          data: { status: "active" },
        })
      }
    }

    return NextResponse.json({ success: true, transaction: { ...transaction, status: "completed" } })
  } catch (error) {
    console.error("[PAYMENT_CONFIRM]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
