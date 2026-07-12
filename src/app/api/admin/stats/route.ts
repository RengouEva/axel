import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/require-auth"
import { checkApiRateLimit } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`admin-stats:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const [
      totalUsers,
      totalClients,
      totalSellers,
      totalAdmins,
      totalProducts,
      totalShops,
      totalOrders,
      revenueAgg,
      recentOrders,
      ordersByStatus,
      unreadMessages,
      users,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "client" } }),
      prisma.user.count({ where: { role: "seller" } }),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.product.count(),
      prisma.shop.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.findMany({
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.contactMessage.count({ where: { read: false } }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ])

    const totalRevenue = revenueAgg._sum.total || 0
    const statusMap: Record<string, number> = {}
    ordersByStatus.forEach((s) => {
      statusMap[s.status] = s._count
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        totalClients,
        totalSellers,
        totalAdmins,
        totalOrders,
        totalProducts,
        totalShops,
        totalRevenue,
        unreadMessages,
      },
      recentOrders,
      users,
      ordersByStatus: {
        pending: statusMap["pending"] || 0,
        processing: statusMap["processing"] || 0,
        delivered: statusMap["delivered"] || 0,
        shipped: statusMap["shipped"] || 0,
        cancelled: statusMap["cancelled"] || 0,
      },
    })
  } catch (error) {
    console.error("[ADMIN_STATS]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
