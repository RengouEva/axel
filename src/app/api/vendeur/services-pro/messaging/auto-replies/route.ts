import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, autoReplySchema } from "@/lib/services-pro-validations"
import { getAutoReplies, createAutoReply, deleteAutoReply } from "@/data/services-pro/messaging"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response
    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
    const autoReplies = await getAutoReplies(shop.id)
    return NextResponse.json({ autoReplies })
  } catch (error) {
    console.error("[SERVICES_PRO_AUTO_REPLIES_GET]", error)
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
    const validation = validateInput(autoReplySchema, body)
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
    await createAutoReply(shop.id, validation.data)
    return NextResponse.json({ message: "Réponse automatique créée" }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_AUTO_REPLIES_POST]", error)
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
    await deleteAutoReply(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_AUTO_REPLIES_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
