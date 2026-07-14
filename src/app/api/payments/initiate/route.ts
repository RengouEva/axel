import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"
import { getPaymentConfig } from "@/lib/payment"

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const body = await request.json()
    const config = getPaymentConfig()
    const isDemo = config.provider === "demo"

    let transactionId = body.transactionId

    if (!transactionId && body.planId && body.type) {
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

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId est requis" }, { status: 400 })
    }

    const shop = await queryOne<any>(
      "SELECT id FROM Shop WHERE sellerId = ? LIMIT 1",
      [auth.user.userId]
    )

    const transaction = await queryOne<any>("SELECT * FROM `Transaction` WHERE id = ?", [transactionId])

    if (!transaction) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 })
    }

    if (shop && transaction.shopId !== shop.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    if (transaction.status !== "pending") {
      return NextResponse.json({ error: "Cette transaction n'est pas en attente" }, { status: 400 })
    }

    if (isDemo) {
      await execute("UPDATE `Transaction` SET status = 'completed' WHERE id = ?", [transaction.id])
      return NextResponse.json({
        success: true,
        demo: true,
        reference: `DEMO-${generateId("REF")}`,
        transaction: { ...transaction, status: "completed" },
      })
    }

    const reference = `PAY-${generateId("REF")}`
    await execute("UPDATE `Transaction` SET reference = ? WHERE id = ?", [reference, transactionId])

    return NextResponse.json({
      success: true,
      reference,
      paymentUrl: `https://payments.example.com/checkout/${reference}`,
      transaction: { ...transaction, reference },
    })
  } catch (error) {
    console.error("[PAYMENT_INITIATE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
