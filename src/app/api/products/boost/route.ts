import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const shop = await prisma.shop.findUnique({
      where: { sellerId: auth.user.userId },
    })
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const boosts = await prisma.productBoost.findMany({
      where: { shopId: shop.id, status: "active" },
      include: {
        product: {
          select: { id: true, name: true, slug: true, image: true, price: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      boosts,
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

    const shop = await prisma.shop.findUnique({
      where: { sellerId: auth.user.userId },
    })
    if (!shop) {
      return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
    }

    const { productId, durationDays } = await request.json()
    if (!productId || typeof productId !== "number") {
      return NextResponse.json({ error: "productId est requis" }, { status: 400 })
    }

    const boostOption = BOOST_OPTIONS.find(o => o.days === durationDays) || BOOST_OPTIONS[2]

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
    }
    if (product.shopId !== shop.id) {
      return NextResponse.json({ error: "Ce produit ne vous appartient pas" }, { status: 403 })
    }

    const existingBoost = await prisma.productBoost.findFirst({
      where: { productId, status: "active" },
    })
    if (existingBoost) {
      return NextResponse.json(
        { error: "Ce produit est déjà en boost actif" },
        { status: 409 }
      )
    }

    const subscription = await prisma.shopSubscription.findFirst({
      where: { shopId: shop.id, status: "active" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    const now = new Date()
    const endDate = new Date(now.getTime() + boostOption.days * 24 * 60 * 60 * 1000)

    if (subscription && subscription.plan.maxBoosts > 0) {
      const activeBoostCount = await prisma.productBoost.count({
        where: { shopId: shop.id, status: "active" },
      })

      if (activeBoostCount < subscription.plan.maxBoosts) {
        const boost = await prisma.productBoost.create({
          data: {
            id: generateId("BST"),
            productId,
            shopId: shop.id,
            startDate: now,
            endDate,
            status: "active",
          },
        })
        return NextResponse.json({ boost, free: true })
      }
    }

    const boostPrice = boostOption.price

    const transaction = await prisma.transaction.create({
      data: {
        id: generateId("TXN"),
        shopId: shop.id,
        userId: auth.user.userId,
        amount: boostPrice,
        type: "boost",
        status: "pending",
        metadata: JSON.stringify({ productId, durationDays: boostOption.days, startDate: now.toISOString(), endDate: endDate.toISOString() }),
      },
    })

    const boost = await prisma.productBoost.create({
      data: {
        id: generateId("BST"),
        productId,
        shopId: shop.id,
        startDate: now,
        endDate,
        status: "pending",
      },
    })

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
