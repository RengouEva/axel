import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, messageSchema, messageReplySchema } from "@/lib/services-pro-validations"
import { getMessages, sendMessage, replyToMessage, markMessageRead } from "@/data/services-pro/messaging"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")

    const result = await getMessages(shop.id, page)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[SERVICES_PRO_MESSAGES_GET]", error)
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
    const { action, ...data } = body

    if (action === 'reply') {
      const validation = validateInput(messageReplySchema, data)
      if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
      await replyToMessage(validation.data.messageId, validation.data.message)
      return NextResponse.json({ message: "Réponse envoyée" })
    }

    if (action === 'mark_read') {
      await markMessageRead(data.messageId)
      return NextResponse.json({ success: true })
    }

    const validation = validateInput(messageSchema, data)
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
    const msg = await sendMessage(shop.id, validation.data)
    return NextResponse.json({ message: msg }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_MESSAGES_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
