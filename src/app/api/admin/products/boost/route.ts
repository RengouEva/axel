import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
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

    const now = new Date()
    const days = durationDays || 30
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    const boostData: any = {
      id: generateId("BST"),
      product: { connect: { id: productId } },
      startDate: now,
      endDate,
      status: "active",
    }
    if (product.shopId) boostData.shopId = product.shopId
    const boost = await prisma.productBoost.create({ data: boostData })

    await prisma.transaction.create({
      data: {
        id: generateId("TXN"),
        shopId: product.shopId,
        userId: auth.user.userId,
        amount: 0,
        type: "boost",
        status: "completed",
        metadata: JSON.stringify({
          productId,
          durationDays: days,
          assignedBy: auth.user.userId,
          adminBoost: true,
        }),
      },
    })

    return NextResponse.json({ boost, free: true })
  } catch (error) {
    console.error("[ADMIN_BOOST_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
