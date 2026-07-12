import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { transactionId } = await request.json()
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

    const reference = `PAY-${Date.now().toString(36).toUpperCase()}-${generateId("REF")}`

    await execute("UPDATE `Transaction` SET reference = ? WHERE id = ?", [reference, transactionId])

    const mockPaymentUrl = `https://payments.example.com/checkout/${reference}`

    return NextResponse.json({
      success: true,
      reference,
      paymentUrl: mockPaymentUrl,
      transaction: { ...transaction, reference },
    })
  } catch (error) {
    console.error("[PAYMENT_INITIATE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
