import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { getDashboardStats, getSellerStats } from "@/data/services-pro/dashboard"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get("period") as '7d' | '30d' | '90d' | '1y') || '30d'

    const [stats, sellerStats] = await Promise.all([
      getDashboardStats(shop.id, period),
      getSellerStats(shop.id),
    ])

    return NextResponse.json({ stats, sellerStats })
  } catch (error) {
    console.error("[SERVICES_PRO_DASHBOARD_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
