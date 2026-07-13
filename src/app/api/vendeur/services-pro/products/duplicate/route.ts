import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { duplicateProduct } from "@/data/services-pro/products"

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const productId = body.productId
    if (!productId) return NextResponse.json({ error: "ID produit requis" }, { status: 400 })

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const product = await queryOne<any>("SELECT * FROM Product WHERE id = ? AND shopId = ?", [productId, shop.id])
    if (!product) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

    const newId = await duplicateProduct(productId)
    if (!newId) return NextResponse.json({ error: "Erreur lors de la duplication" }, { status: 500 })

    const newProduct = await queryOne<any>("SELECT * FROM Product WHERE id = ?", [newId])
    return NextResponse.json({ product: newProduct, message: "Produit dupliqué avec succès" })
  } catch (error) {
    console.error("[SERVICES_PRO_DUPLICATE_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
