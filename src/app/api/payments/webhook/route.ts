import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { getPaymentConfig, verifyPayment } from "@/lib/payment"

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

async function activateBoost(transactionId: string) {
  const transaction = await queryOne<any>("SELECT * FROM `Transaction` WHERE id = ?", [transactionId])
  if (!transaction || transaction.type !== "boost") return

  const meta = typeof transaction.metadata === "string" ? JSON.parse(transaction.metadata) : (transaction.metadata || {})
  if (meta.productId) {
    await execute(
      "UPDATE ProductBoost SET status = 'active' WHERE productId = ? AND shopId = ? AND status = 'pending'",
      [meta.productId, transaction.shopId]
    )
  }
}

async function activateSubscription(transactionId: string) {
  const transaction = await queryOne<any>("SELECT * FROM `Transaction` WHERE id = ?", [transactionId])
  if (!transaction || transaction.type !== "subscription") return

  const meta = typeof transaction.metadata === "string" ? JSON.parse(transaction.metadata) : (transaction.metadata || {})
  const { planId, shopId } = meta

  if (!planId || !shopId) return

  const plan = await queryOne<any>("SELECT * FROM Plan WHERE id = ?", [planId])
  if (!plan) return

  const now = new Date()
  const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

  const pendingSub = await queryOne<any>(
    `SELECT sub.*, p.hasPremiumBadge, p.hasVerifiedBadge, p.hasFeaturedBadge
     FROM ShopSubscription sub JOIN Plan p ON p.id = sub.planId
     WHERE sub.shopId = ? AND sub.planId = ? AND sub.status = 'pending'
     ORDER BY sub.createdAt DESC LIMIT 1`,
    [shopId, planId]
  )

  if (pendingSub) {
    await execute(
      "UPDATE ShopSubscription SET status = 'active', startDate = ?, endDate = ? WHERE id = ?",
      [now, endDate, pendingSub.id]
    )
  } else {
    await execute(
      "INSERT INTO ShopSubscription (id, shopId, planId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)",
      [generateId("SUB"), shopId, planId, now, endDate, "active"]
    )
  }

  const BADGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    premium: { label: "Premium", color: "#FFD700", icon: "crown" },
    verified: { label: "Vérifié", color: "#1DA1F2", icon: "verified" },
    featured: { label: "En vedette", color: "#FF6B35", icon: "star" },
  }

  if (plan.hasPremiumBadge) {
    await execute(
      "INSERT IGNORE INTO ShopBadge (id, shopId, type, label, color, icon, assignedBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [generateId("BDG"), shopId, "premium", BADGE_CONFIG.premium.label, BADGE_CONFIG.premium.color, BADGE_CONFIG.premium.icon, "subscription"]
    )
  }
  if (plan.hasVerifiedBadge) {
    await execute(
      "INSERT IGNORE INTO ShopBadge (id, shopId, type, label, color, icon, assignedBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [generateId("BDG"), shopId, "verified", BADGE_CONFIG.verified.label, BADGE_CONFIG.verified.color, BADGE_CONFIG.verified.icon, "subscription"]
    )
  }
  if (plan.hasFeaturedBadge) {
    await execute(
      "INSERT IGNORE INTO ShopBadge (id, shopId, type, label, color, icon, assignedBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [generateId("BDG"), shopId, "featured", BADGE_CONFIG.featured.label, BADGE_CONFIG.featured.color, BADGE_CONFIG.featured.icon, "subscription"]
    )
  }
}

async function activateCampaign(transactionId: string) {
  const transaction = await queryOne<any>("SELECT * FROM `Transaction` WHERE id = ?", [transactionId])
  if (!transaction || transaction.type !== "ad") return

  const meta = typeof transaction.metadata === "string" ? JSON.parse(transaction.metadata) : (transaction.metadata || {})
  const { campaignId } = meta
  if (!campaignId) return

  await execute("UPDATE AdCampaign SET status = 'active' WHERE id = ?", [campaignId])
}

export async function POST(request: Request) {
  try {
    const config = getPaymentConfig()
    const provider = config.provider

    let transactionId: string | null = null
    let verified = false

    if (provider === "flutterwave") {
      const txId = request.headers.get("x-flw-transaction-id") || ""
      const secretHash = request.headers.get("verif-hash") || ""
      const expectedHash = process.env.FLW_WEBHOOK_SECRET_HASH || ""

      if (secretHash && secretHash !== expectedHash) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }

      if (txId) {
        const result = await verifyPayment("flutterwave", "", txId)
        if (result.success && result.status === "successful") {
          verified = true
          transactionId = txId
        }
      }
    } else if (provider === "paystack") {
      const event = await request.json()
      if (event.event === "charge.success") {
        const reference = event.data.reference
        const result = await verifyPayment("paystack", reference)
        if (result.success && result.status === "success") {
          verified = true
          transactionId = reference
        }
      }
    } else {
      return NextResponse.json({ error: "No payment provider configured" }, { status: 400 })
    }

    if (!verified || !transactionId) {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 })
    }

    const txn = await queryOne<any>("SELECT * FROM `Transaction` WHERE id = ? OR reference = ?", [transactionId, transactionId])
    if (!txn) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (txn.status === "completed") {
      return NextResponse.json({ success: true, alreadyProcessed: true })
    }

    await execute("UPDATE `Transaction` SET status = 'completed', reference = ? WHERE id = ?", [transactionId, txn.id])

    if (txn.type === "boost") {
      await activateBoost(txn.id)
    } else if (txn.type === "subscription") {
      await activateSubscription(txn.id)
    } else if (txn.type === "ad") {
      await activateCampaign(txn.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PAYMENT_WEBHOOK]", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return NextResponse.json({ status: "ok", message: "Payment webhook endpoint ready" })
}