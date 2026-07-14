import { NextResponse } from "next/server"
import { verifyPayment } from "@/lib/payment"
import { queryOne, execute } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get("provider") || "paystack"
    const orderId = searchParams.get("orderId")
    const reference = searchParams.get("reference") || searchParams.get("tx_ref") || ""
    const transactionId = searchParams.get("transaction_id") || ""

    if (!orderId) {
      return NextResponse.redirect(new URL("/panier?payment=error", request.url))
    }

    const result = await verifyPayment(provider, reference, transactionId)

    if (!result.success) {
      await execute("UPDATE `Order` SET status = ? WHERE id = ?", ["payment_failed", orderId])
      const url = new URL(`/checkout?payment=failed&orderId=${orderId}`, request.url)
      url.searchParams.set("error", result.error)
      return NextResponse.redirect(url)
    }

    if (result.status !== "success" && result.status !== "completed") {
      await execute("UPDATE `Order` SET status = ? WHERE id = ?", ["payment_failed", orderId])
      return NextResponse.redirect(new URL(`/checkout?payment=failed&orderId=${orderId}`, request.url))
    }

    await execute(
      "UPDATE `Order` SET status = ?, paymentReference = ?, paymentMethod = ? WHERE id = ?",
      ["confirmed", result.reference, provider, orderId]
    )

    const order = await queryOne<any>("SELECT * FROM `Order` WHERE id = ?", [orderId])
    if (order?.userId) {
      const user = await queryOne<any>("SELECT email FROM User WHERE id = ?", [order.userId])
      if (user?.email) {
        console.log(`[EMAIL] Confirmation envoyée à ${user.email} pour la commande ${orderId}`)
      }
    }

    return NextResponse.redirect(new URL(`/checkout?payment=success&orderId=${orderId}`, request.url))
  } catch (error) {
    console.error("[PAYMENT_VERIFY]", error)
    return NextResponse.redirect(new URL("/panier?payment=error", request.url))
  }
}
