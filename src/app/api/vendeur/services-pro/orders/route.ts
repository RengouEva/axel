import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { getShopOrders } from "@/data/services-pro/orders"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const result = await getShopOrders(shop.id, page, limit)
    return NextResponse.json({ orders: result.orders, total: result.total, page: result.page, totalPages: result.totalPages })
  } catch (error) {
    console.error("[SERVICES_PRO_ORDERS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
