import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")

    const where = sellerId ? { sellerId: Number(sellerId) } : {}

    const shops = await prisma.shop.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, email: true } },
        subscriptions: {
          include: { plan: true },
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        badges: {
          select: { type: true, label: true, color: true, icon: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const formatted = shops.map((shop) => {
      const activeSub = shop.subscriptions[0] || null
      return {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        ownerName: shop.seller.name,
        ownerEmail: shop.seller.email,
        subscription: activeSub
          ? {
              plan: {
                id: activeSub.plan.id,
                name: activeSub.plan.name,
                slug: activeSub.plan.slug,
                price: activeSub.plan.price,
                durationDays: activeSub.plan.durationDays,
              },
              status: activeSub.status,
              endDate: activeSub.endDate,
              badges: shop.badges.map((b) => b.type),
            }
          : null,
      }
    })

    return NextResponse.json({ shops: formatted })
  } catch (error) {
    console.error("[ADMIN_SHOPS_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
