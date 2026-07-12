import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { validateInput, orderCreateSchema } from "@/lib/validations"
import { requireAuth } from "@/lib/require-auth"
import { generateOrderId } from "@/lib/auth-utils"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE))))

    const conditions: string[] = []
    const params: unknown[] = []
    if (auth.user.role === "client") {
      conditions.push("o.userId = ?")
      params.push(auth.user.userId)
    }
    const whereSQL = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""

    const [orders, totalRow] = await Promise.all([
      queryAll<any>(
        `SELECT o.*, u.id as _user_id, u.name as _user_name, u.email as _user_email
         FROM \`Order\` o LEFT JOIN User u ON u.id = o.userId ${whereSQL} ORDER BY o.createdAt DESC LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit]
      ),
      queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM \`Order\` o ${whereSQL}`, params),
    ])

    const total = totalRow?.count ?? 0

    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      const placeholders = orderIds.map(() => "?").join(",")
      const allItems = await queryAll<any>(`SELECT * FROM OrderItem WHERE orderId IN (${placeholders})`, orderIds)
      const itemsByOrder: Record<string, any[]> = {}
      for (const item of allItems) {
        if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = []
        itemsByOrder[item.orderId].push(item)
      }
      for (const order of orders) {
        order.items = itemsByOrder[order.id] || []
        order.user = order._user_id ? { id: order._user_id, name: order._user_name, email: order._user_email } : null
        delete order._user_id; delete order._user_name; delete order._user_email
      }
    }

    return NextResponse.json({
      orders,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[ORDERS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`orders:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const body = await request.json()
    const validation = validateInput(orderCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { total, items, shipping } = validation.data
    const orderId = generateOrderId()
    const now = new Date()

    await execute(
      `INSERT INTO \`Order\` (id, date, status, total, userId, shippingName, shippingEmail, shippingPhone, shippingAddress, countryId, cityId, districtId, deliveryMethod)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, now, "pending", total, auth.user.userId,
       shipping?.name || null, shipping?.email || null, shipping?.telephone || null,
       shipping?.address || null, shipping?.countryId || null, shipping?.cityId || null,
       shipping?.districtId || null, shipping?.method || null]
    )

    for (const item of items) {
      await execute(
        "INSERT INTO OrderItem (orderId, productId, name, quantity, price) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.productId, item.name, item.quantity, item.price]
      )
    }

    const orderItems = await queryAll<any>("SELECT * FROM OrderItem WHERE orderId = ?", [orderId])
    const newOrder = await queryOne<any>("SELECT * FROM `Order` WHERE id = ?", [orderId])
    newOrder.items = orderItems

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("[ORDERS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
