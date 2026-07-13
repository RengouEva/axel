import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, stockAlertSchema } from "@/lib/services-pro-validations"
import { getStockAlerts, setStockAlert, removeStockAlert } from "@/data/services-pro/products"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const alerts = await getStockAlerts(shop.id)
    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("[SERVICES_PRO_STOCK_ALERTS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const body = await request.json()
    const validation = validateInput(stockAlertSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await setStockAlert(validation.data.productId, shop.id, validation.data.threshold)
    return NextResponse.json({ message: "Alerte de stock configurée" })
  } catch (error) {
    console.error("[SERVICES_PRO_STOCK_ALERTS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    await removeStockAlert(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_STOCK_ALERTS_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
