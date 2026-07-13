import { queryOne, queryAll } from "@/lib/db"
import type { DashboardStats } from "@/lib/services-pro-types"

export async function getDashboardStats(shopId: string, period: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<DashboardStats> {
  const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
  const days = daysMap[period]

  const now = new Date()
  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000)

  const currentOrders = await queryAll<any>(
    `SELECT oi.*, o.total, o.status, o.createdAt
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     JOIN Product p ON p.id = oi.productId
     WHERE p.shopId = ? AND o.createdAt >= ?`,
    [shopId, currentStart]
  )

  const previousOrders = await queryAll<any>(
    `SELECT oi.*, o.total, o.status, o.createdAt
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     JOIN Product p ON p.id = oi.productId
     WHERE p.shopId = ? AND o.createdAt >= ? AND o.createdAt < ?`,
    [shopId, previousStart, currentStart]
  )

  const currentRevenue = currentOrders.reduce((s, o) => s + Number(o.price || 0) * Number(o.quantity || 0), 0)
  const previousRevenue = previousOrders.reduce((s, o) => s + Number(o.price || 0) * Number(o.quantity || 0), 0)
  const currentOrderCount = currentOrders.length
  const previousOrderCount = previousOrders.length

  const currentVisitors = await queryOne<{ count: number }>(
    `SELECT COUNT(DISTINCT sessionId) as count FROM ProductEvent
     WHERE shopId = ? AND createdAt >= ?`,
    [shopId, currentStart]
  ) || { count: 0 }

  const previousVisitors = await queryOne<{ count: number }>(
    `SELECT COUNT(DISTINCT sessionId) as count FROM ProductEvent
     WHERE shopId = ? AND createdAt >= ? AND createdAt < ?`,
    [shopId, previousStart, currentStart]
  ) || { count: 0 }

  const currentConversions = currentOrders.filter(o => o.status === 'delivered').length
  const conversionRate = currentVisitors.count > 0 ? (currentConversions / currentVisitors.count) * 100 : 0

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const topProducts = await queryAll<any>(
    `SELECT p.id, p.name, COUNT(DISTINCT pe.id) as views, COUNT(DISTINCT oi.id) as sales
     FROM Product p
     LEFT JOIN ProductEvent pe ON pe.productId = p.id AND pe.type = 'view' AND pe.createdAt >= ?
     LEFT JOIN OrderItem oi ON oi.productId = p.id
     LEFT JOIN \`Order\` o ON o.id = oi.orderId AND o.createdAt >= ?
     WHERE p.shopId = ?
     GROUP BY p.id ORDER BY views DESC LIMIT 10`,
    [currentStart, currentStart, shopId]
  )

  const topSelling = await queryAll<any>(
    `SELECT p.id, p.name, SUM(oi.quantity) as quantity, SUM(oi.price * oi.quantity) as revenue
     FROM OrderItem oi
     JOIN Product p ON p.id = oi.productId
     JOIN \`Order\` o ON o.id = oi.orderId
     WHERE p.shopId = ? AND o.createdAt >= ?
     GROUP BY p.id ORDER BY quantity DESC LIMIT 10`,
    [shopId, currentStart]
  )

  const revenueByPeriod = await queryAll<any>(
    `SELECT DATE(o.createdAt) as date, SUM(oi.price * oi.quantity) as amount
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     JOIN Product p ON p.id = oi.productId
     WHERE p.shopId = ? AND o.createdAt >= ?
     GROUP BY DATE(o.createdAt) ORDER BY date ASC`,
    [shopId, currentStart]
  )

  const performance = await queryAll<any>(
    `SELECT DATE(o.createdAt) as date,
            SUM(oi.price * oi.quantity) as revenue,
            COUNT(DISTINCT o.id) as orders,
            COUNT(DISTINCT pe.sessionId) as visitors
     FROM \`Order\` o
     JOIN OrderItem oi ON oi.orderId = o.id
     JOIN Product p ON p.id = oi.productId
     LEFT JOIN ProductEvent pe ON pe.shopId = p.shopId AND DATE(pe.createdAt) = DATE(o.createdAt)
     WHERE p.shopId = ? AND o.createdAt >= ?
     GROUP BY DATE(o.createdAt) ORDER BY date ASC`,
    [shopId, currentStart]
  )

  return {
    revenue: { total: currentRevenue, change: calcChange(currentRevenue, previousRevenue) },
    orders: { total: currentOrderCount, change: calcChange(currentOrderCount, previousOrderCount) },
    visitors: { total: currentVisitors.count, change: calcChange(currentVisitors.count, previousVisitors.count) },
    conversionRate: { value: Math.round(conversionRate * 100) / 100, change: 0 },
    topProducts: topProducts.map((p: any) => ({ id: p.id, name: p.name, views: Number(p.views || 0), sales: Number(p.sales || 0) })),
    topSelling: topSelling.map((p: any) => ({ id: p.id, name: p.name, quantity: Number(p.quantity || 0), revenue: Number(p.revenue || 0) })),
    revenueByPeriod: revenueByPeriod.map((r: any) => ({ period: r.date, amount: Number(r.amount || 0) })),
    performance: performance.map((p: any) => ({ date: p.date, revenue: Number(p.revenue || 0), orders: Number(p.orders || 0), visitors: Number(p.visitors || 0) })),
  }
}

export async function getSellerStats(shopId: string): Promise<{
  totalProducts: number
  activeListings: number
  averageRating: number
  totalReviews: number
  verifiedBadge: boolean
}> {
  const [productStats, shopData, verification] = await Promise.all([
    queryOne<any>(
      `SELECT COUNT(*) as totalProducts,
              SUM(CASE WHEN inStock = 1 THEN 1 ELSE 0 END) as activeListings,
              COALESCE(AVG(rating), 0) as averageRating,
              SUM(reviews) as totalReviews
       FROM Product WHERE shopId = ?`,
      [shopId]
    ),
    queryOne<any>("SELECT rating, totalSales FROM Shop WHERE id = ?", [shopId]),
    queryOne<any>("SELECT status FROM SellerVerification WHERE shopId = ?", [shopId]),
  ])

  return {
    totalProducts: Number(productStats?.totalProducts || 0),
    activeListings: Number(productStats?.activeListings || 0),
    averageRating: Math.round(Number(productStats?.averageRating || 0) * 10) / 10,
    totalReviews: Number(productStats?.totalReviews || 0),
    verifiedBadge: verification?.status === 'approved',
  }
}
