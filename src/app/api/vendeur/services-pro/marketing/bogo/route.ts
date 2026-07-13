import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, bogoOfferSchema } from "@/lib/services-pro-validations"
import { getBogoOffers, createBogoOffer, deleteBogoOffer } from "@/data/services-pro/marketing"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const offers = await getBogoOffers(shop.id)
    return NextResponse.json({ offers })
  } catch (error) {
    console.error("[SERVICES_PRO_BOGO_GET]", error)
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
    const validation = validateInput(bogoOfferSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const offer = await createBogoOffer(shop.id, validation.data)
    return NextResponse.json({ offer }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_BOGO_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    await deleteBogoOffer(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_BOGO_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
