import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const verification = await queryOne<any>(
      "SELECT status, verificationType FROM SellerVerification WHERE shopId = ?",
      [shop.id]
    )

    return NextResponse.json({
      module: "services-pro",
      version: "1.0.0",
      shopId: shop.id,
      features: {
        verification: true,
        dashboard: true,
        advancedProducts: true,
        orderManagement: true,
        shopManagement: true,
        marketing: true,
        messaging: true,
        reports: true,
        api: true,
        ai: true,
        notifications: true,
        security: true,
      },
      verificationStatus: verification?.status || 'not_submitted',
      sellerName: auth.user.email,
    })
  } catch (error) {
    console.error("[SERVICES_PRO_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
