import { NextResponse } from "next/server"
import { queryOne, queryAll } from "@/lib/db"
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
      totalUsersRow,
      totalClientsRow,
      totalSellersRow,
      totalAdminsRow,
      totalProductsRow,
      totalShopsRow,
      totalOrdersRow,
      revenueRow,
      recentOrders,
      ordersByStatus,
      users,
    ] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM User"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM User WHERE role = 'client'"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM User WHERE role = 'seller'"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM User WHERE role = 'admin'"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Product"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Shop"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM `Order`"),
      queryOne<{ total: number | null }>("SELECT SUM(total) as total FROM `Order`"),
      queryAll<any>(
        `SELECT o.*, u.id as _user_id, u.name as _user_name, u.email as _user_email
         FROM \`Order\` o LEFT JOIN User u ON u.id = o.userId
         ORDER BY o.createdAt DESC LIMIT 5`
      ),
      queryAll<{ status: string; count: number }>(
        "SELECT status, COUNT(*) as count FROM `Order` GROUP BY status"
      ),
      queryAll<any>(
        "SELECT id, name, email, role, createdAt FROM User ORDER BY createdAt DESC"
      ),
    ])

    let unreadMessages = 0
    try {
      const msgRow = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM ContactMessage WHERE isRead = 0")
      unreadMessages = msgRow?.count ?? 0
    } catch {}

    const totalUsers = totalUsersRow?.count ?? 0
    const totalClients = totalClientsRow?.count ?? 0
    const totalSellers = totalSellersRow?.count ?? 0
    const totalAdmins = totalAdminsRow?.count ?? 0
    const totalProducts = totalProductsRow?.count ?? 0
    const totalShops = totalShopsRow?.count ?? 0
    const totalOrders = totalOrdersRow?.count ?? 0
    const totalRevenue = revenueRow?.total ?? 0

    if (recentOrders.length > 0) {
      const orderIds = recentOrders.map((o: any) => o.id)
      const placeholders = orderIds.map(() => "?").join(",")
      const allItems = await queryAll<any>(`SELECT * FROM OrderItem WHERE orderId IN (${placeholders})`, orderIds)
      const itemsByOrder: Record<string, any[]> = {}
      for (const item of allItems) {
        if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
        itemsByOrder[item.orderId].push(item)
      }
      for (const order of recentOrders) {
        order.items = itemsByOrder[order.id] || []
        order.user = order._user_id ? { id: order._user_id, name: order._user_name, email: order._user_email } : null
        delete order._user_id; delete order._user_name; delete order._user_email
      }
    }

    const statusMap: Record<string, number> = {}
    ordersByStatus.forEach((s) => {
      statusMap[s.status] = s.count
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
