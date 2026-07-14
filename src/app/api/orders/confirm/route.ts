import { NextResponse } from "next/server"
import { execute } from "@/lib/db"
import { checkApiRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`orders-confirm:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const { orderId, paymentMethod } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: "orderId requis" }, { status: 400 })
    }

    await execute(
      "UPDATE `Order` SET status = ?, paymentMethod = ? WHERE id = ?",
      ["confirmed", paymentMethod || "cash_on_delivery", orderId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ORDERS_CONFIRM]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
