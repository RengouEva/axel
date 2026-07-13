import { queryOne, queryAll, execute } from "@/lib/db"
import type { SellerReport } from "@/lib/services-pro-types"

export async function getReports(shopId: string, type?: string): Promise<SellerReport[]> {
  const sql = type
    ? "SELECT * FROM SellerReport WHERE shopId = ? AND type = ? ORDER BY generatedAt DESC"
    : "SELECT * FROM SellerReport WHERE shopId = ? ORDER BY generatedAt DESC"
  const params = type ? [shopId, type] : [shopId]
  const reports = await queryAll<any>(sql, params)
  return reports.map((r: any) => ({
    ...r,
    data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
  }))
}

export async function generateReport(shopId: string, type: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<SellerReport | null> {
  const now = new Date()
  let period: string
  let startDate: Date

  switch (type) {
    case 'daily':
      period = now.toISOString().split('T')[0]
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case 'weekly':
      period = `W${getWeekNumber(now)}`
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'monthly':
      period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'yearly':
      period = `${now.getFullYear()}`
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      return null
  }

  const orders = await queryAll<any>(
    `SELECT oi.*, o.total, o.status, o.createdAt
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     JOIN Product p ON p.id = oi.productId
     WHERE p.shopId = ? AND o.createdAt >= ?`,
    [shopId, startDate]
  )

  const revenue = orders.reduce((s, o) => s + Number(o.price || 0) * Number(o.quantity || 0), 0)

  const topProducts = await queryAll<any>(
    `SELECT p.id, p.name, SUM(oi.quantity) as sales, SUM(oi.price * oi.quantity) as revenue
     FROM OrderItem oi
     JOIN Product p ON p.id = oi.productId
     JOIN \`Order\` o ON o.id = oi.orderId
     WHERE p.shopId = ? AND o.createdAt >= ?
     GROUP BY p.id ORDER BY sales DESC LIMIT 10`,
    [shopId, startDate]
  )

  const orderStatusBreakdown = await queryAll<any>(
    `SELECT o.status, COUNT(DISTINCT o.id) as count
     FROM \`Order\` o
     JOIN OrderItem oi ON oi.orderId = o.id
     JOIN Product p ON p.id = oi.productId
     WHERE p.shopId = ? AND o.createdAt >= ?
     GROUP BY o.status`,
    [shopId, startDate]
  )

  const statusBreakdown: Record<string, number> = {}
  for (const row of orderStatusBreakdown) {
    statusBreakdown[row.status] = Number(row.count)
  }

  const revenueByDay = await queryAll<any>(
    `SELECT DATE(o.createdAt) as date, SUM(oi.price * oi.quantity) as amount
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     JOIN Product p ON p.id = oi.productId
     WHERE p.shopId = ? AND o.createdAt >= ?
     GROUP BY DATE(o.createdAt) ORDER BY date ASC`,
    [shopId, startDate]
  )

  const reportData = {
    revenue,
    orders: orders.length,
    visitors: 0,
    conversionRate: 0,
    averageOrderValue: orders.length > 0 ? Math.round(revenue / orders.length) : 0,
    topProducts: topProducts.map((p: any) => ({
      id: p.id, name: p.name, sales: Number(p.sales || 0), revenue: Number(p.revenue || 0),
    })),
    revenueByDay: revenueByDay.map((r: any) => ({ date: r.date, amount: Number(r.amount || 0) })),
    orderStatusBreakdown: statusBreakdown,
  }

  const id = `RPT-${type.toUpperCase()}-${period}-${Date.now().toString(36)}`.toUpperCase()
  await execute(
    "INSERT INTO SellerReport (id, shopId, type, period, data) VALUES (?, ?, ?, ?, ?)",
    [id, shopId, type, period, JSON.stringify(reportData)]
  )
  return queryOne<SellerReport>("SELECT * FROM SellerReport WHERE id = ?", [id])
}

function getWeekNumber(date: Date): number {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}
