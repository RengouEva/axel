import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { validateInput, shopUpdateSchema } from "@/lib/validations"
import { requireAuth } from "@/lib/require-auth"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shop = await queryOne<any>(
      `SELECT s.*, u.id as _sellerId, u.name as _sellerName, u.email as _sellerEmail
       FROM Shop s LEFT JOIN User u ON u.id = s.sellerId WHERE s.id = ?`,
      [id]
    )
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }
    shop.seller = { id: shop._sellerId, name: shop._sellerName, email: shop._sellerEmail }
    delete shop._sellerId; delete shop._sellerName; delete shop._sellerEmail
    return NextResponse.json(shop)
  } catch (error) {
    console.error("[SHOP_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkApiRateLimit(ip)
    const rateLimitHeaders = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429, headers: rateLimitHeaders }
      )
    }

    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { id } = await params
    const existing = await queryOne<any>("SELECT * FROM Shop WHERE id = ?", [id])
    if (!existing) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }
    if (existing.sellerId !== auth.user.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateInput(shopUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updates = validation.data as Record<string, unknown>
    const setClauses = Object.keys(updates).map(k => `${k} = ?`)
    const values = Object.values(updates)
    await execute(`UPDATE Shop SET ${setClauses.join(", ")} WHERE id = ?`, [...values, id])

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE id = ?", [id])
    return NextResponse.json(shop)
  } catch (error) {
    console.error("[SHOP_PUT]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { id } = await params
    const existing = await queryOne<any>("SELECT * FROM Shop WHERE id = ?", [id])
    if (!existing) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }
    if (existing.sellerId !== auth.user.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await execute("DELETE FROM Shop WHERE id = ?", [id])
    return NextResponse.json({ message: "Boutique supprimée" })
  } catch (error) {
    console.error("[SHOP_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
