import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, flashSaleSchema } from "@/lib/services-pro-validations"
import { getFlashSales, createFlashSale, toggleFlashSale } from "@/data/services-pro/marketing"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const flashSales = await getFlashSales(shop.id)
    return NextResponse.json({ flashSales })
  } catch (error) {
    console.error("[SERVICES_PRO_FLASH_GET]", error)
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
    const validation = validateInput(flashSaleSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const flashSale = await createFlashSale(shop.id, validation.data)
    return NextResponse.json({ flashSale }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_FLASH_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    await toggleFlashSale(body.id, body.isActive)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_FLASH_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
