import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params

    const shop = await queryOne<any>(
      `SELECT s.*, u.id as _sellerId, u.name as _sellerName, u.email as _sellerEmail
       FROM Shop s LEFT JOIN User u ON u.id = s.sellerId WHERE s.id = ?`,
      [id]
    )

    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }

    const [subscriptions, badges, boosts, productCountRow] = await Promise.all([
      queryAll<any>(
        `SELECT sub.*, p.id as _plan_id, p.name as _plan_name, p.slug as _plan_slug, p.price as _plan_price, p.durationDays as _plan_durationDays, p.description as _plan_description
         FROM ShopSubscription sub LEFT JOIN Plan p ON p.id = sub.planId
         WHERE sub.shopId = ? ORDER BY sub.createdAt DESC`,
        [id]
      ),
      queryAll<any>("SELECT * FROM ShopBadge WHERE shopId = ?", [id]),
      queryAll<any>(
        `SELECT b.*, pr.id as _product_id, pr.name as _product_name, pr.slug as _product_slug, pr.image as _product_image
         FROM ProductBoost b LEFT JOIN Product pr ON pr.id = b.productId
         WHERE b.shopId = ? ORDER BY b.createdAt DESC`,
        [id]
      ),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Product WHERE shopId = ?", [id]),
    ])

    shop.seller = { id: shop._sellerId, name: shop._sellerName, email: shop._sellerEmail }
    delete shop._sellerId; delete shop._sellerName; delete shop._sellerEmail

    shop.subscriptions = subscriptions.map((sub: any) => {
      const plan = sub._plan_id ? {
        id: sub._plan_id, name: sub._plan_name, slug: sub._plan_slug,
        price: sub._plan_price, durationDays: sub._plan_durationDays, description: sub._plan_description
      } : null
      const { _plan_id, _plan_name, _plan_slug, _plan_price, _plan_durationDays, _plan_description, ...rest } = sub
      return { ...rest, plan }
    })

    shop.badges = badges
    shop.boosts = boosts.map((b: any) => {
      const product = b._product_id ? {
        id: b._product_id, name: b._product_name, slug: b._product_slug, image: b._product_image
      } : null
      const { _product_id, _product_name, _product_slug, _product_image, ...rest } = b
      return { ...rest, product }
    })

    shop._count = { products: productCountRow?.count ?? 0 }

    return NextResponse.json(shop)
  } catch (error) {
    console.error("[ADMIN_SHOP_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params

    const shop = await queryOne<any>("SELECT id FROM Shop WHERE id = ?", [id])
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }

    await execute("DELETE FROM Shop WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_SHOP_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
