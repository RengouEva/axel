import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { productId, durationDays } = await request.json()
    if (!productId || typeof productId !== "number") {
      return NextResponse.json({ error: "productId est requis" }, { status: 400 })
    }

    const product = await queryOne<any>("SELECT * FROM Product WHERE id = ?", [productId])
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
    }

    const existingBoost = await queryOne<any>(
      "SELECT id FROM ProductBoost WHERE productId = ? AND status = 'active' LIMIT 1",
      [productId]
    )
    if (existingBoost) {
      return NextResponse.json(
        { error: "Ce produit est déjà en boost actif" },
        { status: 409 }
      )
    }

    const now = new Date()
    const days = durationDays || 30
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const boostId = generateId("BST")

    await execute(
      "INSERT INTO ProductBoost (id, productId, shopId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)",
      [boostId, productId, product.shopId || null, now, endDate, "active"]
    )

    await execute(
      "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [generateId("TXN"), product.shopId || null, auth.user.userId, 0, "boost", "completed",
       JSON.stringify({ productId, durationDays: days, assignedBy: auth.user.userId, adminBoost: true })]
    )

    const boost = await queryOne<any>("SELECT * FROM ProductBoost WHERE id = ?", [boostId])

    return NextResponse.json({ boost, free: true })
  } catch (error) {
    console.error("[ADMIN_BOOST_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
