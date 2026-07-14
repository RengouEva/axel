import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { validateInput, productUpdateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const productId = Number(id)

    const product = await queryOne<any>("SELECT shopId FROM Product WHERE id = ?", [productId])
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
    }

    const shop = await queryOne<any>("SELECT sellerId FROM Shop WHERE id = ?", [product.shopId])
    if (!shop || (shop.sellerId !== auth.user.userId && auth.user.role !== "admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateInput(productUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updates = validation.data as Record<string, unknown>
    const setClauses = Object.keys(updates).map(k => `${k} = ?`)
    const values = Object.values(updates)

    await execute(
      `UPDATE Product SET ${setClauses.join(", ")} WHERE id = ?`,
      [...values, productId]
    )

    const updated = await queryOne<any>(
      `SELECT p.*, s.id as _shop_id, s.name as _shop_name, s.slug as _shop_slug, s.logo as _shop_logo, s.category as _shop_category
       FROM Product p LEFT JOIN Shop s ON s.id = p.shopId WHERE p.id = ?`,
      [productId]
    )
    if (updated._shop_id) {
      updated.shop = { id: updated._shop_id, name: updated._shop_name, slug: updated._shop_slug, logo: updated._shop_logo, category: updated._shop_category }
      delete updated._shop_id; delete updated._shop_name; delete updated._shop_slug; delete updated._shop_logo; delete updated._shop_category
    } else {
      updated.shop = null
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PRODUCT_PUT]", error)
    return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const productId = Number(id)

    const product = await queryOne<any>("SELECT shopId FROM Product WHERE id = ?", [productId])
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
    }

    const shop = await queryOne<any>("SELECT sellerId FROM Shop WHERE id = ?", [product.shopId])
    if (!shop || (shop.sellerId !== auth.user.userId && auth.user.role !== "admin")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await execute("DELETE FROM Product WHERE id = ?", [productId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error)
    return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
  }
}
