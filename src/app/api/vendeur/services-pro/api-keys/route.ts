import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, apiKeySchema } from "@/lib/services-pro-validations"
import { getApiKeys, createApiKey, deleteApiKey } from "@/data/services-pro/api-keys"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const keys = await getApiKeys(shop.id)
    return NextResponse.json({ keys })
  } catch (error) {
    console.error("[SERVICES_PRO_API_KEYS_GET]", error)
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
    const validation = validateInput(apiKeySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const result = await createApiKey(shop.id, validation.data)
    if (!result) return NextResponse.json({ error: "Erreur de création" }, { status: 500 })

    return NextResponse.json({
      key: result.key,
      rawKey: result.rawKey,
      warning: "Conservez cette clé précieusement. Elle ne sera plus jamais affichée.",
    }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_API_KEYS_POST]", error)
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

    await deleteApiKey(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_API_KEYS_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
