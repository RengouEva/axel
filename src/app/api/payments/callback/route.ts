import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { verifyPayment } from "@/lib/payment"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")
    const transactionId = searchParams.get("transactionId")

    if (!reference && !transactionId) {
      return NextResponse.redirect(new URL("/vendeur/boutique?error=missing_ref", process.env.NEXT_PUBLIC_SITE_URL))
    }

    const transaction = reference
      ? await queryOne<any>("SELECT * FROM `Transaction` WHERE reference = ? LIMIT 1", [reference])
      : await queryOne<any>("SELECT * FROM `Transaction` WHERE id = ?", [transactionId])

    if (!transaction) {
      return NextResponse.redirect(new URL("/vendeur/boutique?error=txn_not_found", process.env.NEXT_PUBLIC_SITE_URL))
    }

    if (transaction.status === "completed") {
      return NextResponse.redirect(new URL("/vendeur/boutique?success=1", process.env.NEXT_PUBLIC_SITE_URL))
    }

    const config = { provider: process.env.PAYMENT_PROVIDER || "demo" }
    const provider = config.provider

    const result = await verifyPayment(provider, reference || "", transactionId)

    if (result.success && result.status === "success") {
      await execute("UPDATE `Transaction` SET status = 'completed', reference = ? WHERE id = ?", [reference || result.reference, transaction.id])

      if (transaction.type === "boost" && transaction.metadata) {
        const meta = typeof transaction.metadata === "string" ? JSON.parse(transaction.metadata) : transaction.metadata
        if (meta.productId) {
          await execute(
            "UPDATE ProductBoost SET status = 'active' WHERE productId = ? AND shopId = ? AND status = 'pending'",
            [meta.productId, transaction.shopId]
          )
        }
      }

      if (transaction.type === "subscription" && transaction.metadata) {
        const meta = typeof transaction.metadata === "string" ? JSON.parse(transaction.metadata) : transaction.metadata
        const pendingSub = await queryOne<any>(
          `SELECT sub.*, p.hasPremiumBadge, p.hasVerifiedBadge, p.hasFeaturedBadge
           FROM ShopSubscription sub JOIN Plan p ON p.id = sub.planId
           WHERE sub.shopId = ? AND sub.planId = ? AND sub.status = 'pending'
           ORDER BY sub.createdAt DESC LIMIT 1`,
          [transaction.shopId, meta.planId]
        )
        if (pendingSub) {
          const now = new Date()
          const endDate = new Date(now.getTime() + pendingSub.durationDays * 24 * 60 * 60 * 1000)
          await execute("UPDATE ShopSubscription SET status = 'active', startDate = ?, endDate = ? WHERE id = ?", [now, endDate, pendingSub.id])
        }
      }

      if (transaction.type === "ad" && transaction.metadata) {
        const meta = typeof transaction.metadata === "string" ? JSON.parse(transaction.metadata) : transaction.metadata
        if (meta.campaignId) {
          await execute("UPDATE AdCampaign SET status = 'active', budget = budget + ? WHERE id = ?", [transaction.amount, meta.campaignId])
        }
      }
    }

    const redirectUrl = result.success
      ? `/vendeur/boutique?success=1&ref=${reference || result.reference}`
      : `/vendeur/boutique?error=payment_failed`

    return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_SITE_URL))
  } catch (error) {
    console.error("[PAYMENT_CALLBACK]", error)
    return NextResponse.redirect(new URL("/vendeur/boutique?error=server_error", process.env.NEXT_PUBLIC_SITE_URL))
  }
}