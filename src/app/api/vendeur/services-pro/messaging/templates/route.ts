import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, messageTemplateSchema } from "@/lib/services-pro-validations"
import { getMessageTemplates, createMessageTemplate, deleteMessageTemplate } from "@/data/services-pro/messaging"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response
    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
    const templates = await getMessageTemplates(shop.id)
    return NextResponse.json({ templates })
  } catch (error) {
    console.error("[SERVICES_PRO_TEMPLATES_GET]", error)
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
    const validation = validateInput(messageTemplateSchema, body)
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
    await createMessageTemplate(shop.id, validation.data)
    return NextResponse.json({ message: "Modèle créé" }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_TEMPLATES_POST]", error)
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
    await deleteMessageTemplate(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_TEMPLATES_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
