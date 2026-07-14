import { NextResponse } from "next/server"
import { initializePayment, getPaymentConfig } from "@/lib/payment"
import { checkApiRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`payment:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const body = await request.json()
    const { email, amount, orderId, customerName, customerPhone } = body

    if (!email || !amount || !orderId) {
      return NextResponse.json({ error: "Email, montant et orderId requis" }, { status: 400 })
    }

    const config = getPaymentConfig()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const callbackUrl = `${siteUrl}/api/payment/verify?provider=${config.provider}&orderId=${orderId}`

    const result = await initializePayment({
      email,
      amount,
      orderId,
      callbackUrl,
      customerName,
      customerPhone,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
      provider: config.provider,
    })
  } catch (error) {
    console.error("[PAYMENT_INITIALIZE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
