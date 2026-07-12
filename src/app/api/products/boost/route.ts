import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`
}

const BOOST_OPTIONS = [
  { days: 7, price: 2000 },
  { days: 15, price: 3500 },
  { days: 30, price: 5000 },
]

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT id FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const boosts = await queryAll<any>(
      `SELECT b.*, pr.id as _product_id, pr.name as _product_name, pr.slug as _product_slug, pr.image as _product_image, pr.price as _product_price
       FROM ProductBoost b LEFT JOIN Product pr ON pr.id = b.productId
       WHERE b.shopId = ? AND b.status = 'active' ORDER BY b.createdAt DESC`,
      [shop.id]
    )

    const mappedBoosts = boosts.map((b: any) => {
      const product = b._product_id ? {
        id: b._product_id, name: b._product_name, slug: b._product_slug,
        image: b._product_image, price: b._product_price
      } : null
      const { _product_id, _product_name, _product_slug, _product_image, _product_price, ...rest } = b
      return { ...rest, product }
    })

    return NextResponse.json({
      boosts: mappedBoosts,
      boostOptions: BOOST_OPTIONS,
    })
  } catch (error) {
    console.error("[BOOSTS_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const { productId, durationDays } = await request.json()
    if (!productId || typeof productId !== "number") {
      return NextResponse.json({ error: "productId est requis" }, { status: 400 })
    }

    const boostOption = BOOST_OPTIONS.find(o => o.days === durationDays) || BOOST_OPTIONS[2]

    const product = await queryOne<any>("SELECT * FROM Product WHERE id = ?", [productId])
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
    }
    if (product.shopId !== shop.id) {
      return NextResponse.json({ error: "Ce produit ne vous appartient pas" }, { status: 403 })
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

    const subscription = await queryOne<any>(
      `SELECT sub.*, p.maxBoosts FROM ShopSubscription sub JOIN Plan p ON p.id = sub.planId
       WHERE sub.shopId = ? AND sub.status = 'active' ORDER BY sub.createdAt DESC LIMIT 1`,
      [shop.id]
    )

    const now = new Date()
    const endDate = new Date(now.getTime() + boostOption.days * 24 * 60 * 60 * 1000)

    if (subscription && subscription.maxBoosts > 0) {
      const countRow = await queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM ProductBoost WHERE shopId = ? AND status = 'active'",
        [shop.id]
      )
      const activeBoostCount = countRow?.count ?? 0

      if (activeBoostCount < subscription.maxBoosts) {
        const boostId = generateId("BST")
        await execute(
          "INSERT INTO ProductBoost (id, productId, shopId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)",
          [boostId, productId, shop.id, now, endDate, "active"]
        )
        const boost = await queryOne<any>("SELECT * FROM ProductBoost WHERE id = ?", [boostId])
        return NextResponse.json({ boost, free: true })
      }
    }

    const boostPrice = boostOption.price
    const txnId = generateId("TXN")
    const boostId = generateId("BST")

    await execute(
      "INSERT INTO Transaction (id, shopId, userId, amount, type, status, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [txnId, shop.id, auth.user.userId, boostPrice, "boost", "pending",
       JSON.stringify({ productId, durationDays: boostOption.days, startDate: now.toISOString(), endDate: endDate.toISOString() })]
    )

    await execute(
      "INSERT INTO ProductBoost (id, productId, shopId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?)",
      [boostId, productId, shop.id, now, endDate, "pending"]
    )

    const [boost, transaction] = await Promise.all([
      queryOne<any>("SELECT * FROM ProductBoost WHERE id = ?", [boostId]),
      queryOne<any>("SELECT * FROM Transaction WHERE id = ?", [txnId]),
    ])

    return NextResponse.json({
      requiresPayment: true,
      boost,
      transaction,
      price: boostPrice,
    })
  } catch (error) {
    console.error("[BOOSTS_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
