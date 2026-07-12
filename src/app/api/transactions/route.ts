import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))

    const isAdmin = auth.user.role === "admin"

    let where = {}
    if (!isAdmin) {
      const shop = await prisma.shop.findUnique({
        where: { sellerId: auth.user.userId },
      })
      if (!shop) {
        return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
      }
      where = { shopId: shop.id }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: isAdmin
          ? { shop: { select: { id: true, name: true } }, user: { select: { id: true, name: true } } }
          : undefined,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
