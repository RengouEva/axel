import { NextResponse } from "next/server"
import { queryOne, queryAll } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))

    const isAdmin = auth.user.role === "admin"

    let conditions: string[] = []
    let params: unknown[] = []
    if (!isAdmin) {
      const shop = await queryOne<any>("SELECT id FROM Shop WHERE sellerId = ?", [auth.user.userId])
      if (!shop) {
        return NextResponse.json({ error: "Vous n'avez pas de boutique" }, { status: 404 })
      }
      conditions.push("t.shopId = ?")
      params.push(shop.id)
    }
    const whereSQL = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""

    const [transactions, totalRow] = await Promise.all([
      queryAll<any>(
        isAdmin
          ? `SELECT t.*, s.id as _shop_id, s.name as _shop_name, u.id as _user_id, u.name as _user_name
             FROM \`Transaction\` t LEFT JOIN Shop s ON s.id = t.shopId LEFT JOIN User u ON u.id = t.userId ${whereSQL} ORDER BY t.createdAt DESC LIMIT ? OFFSET ?`
          : `SELECT t.* FROM \`Transaction\` t ${whereSQL} ORDER BY t.createdAt DESC LIMIT ? OFFSET ?`,
        isAdmin ? [...params, limit, (page - 1) * limit] : [...params, limit, (page - 1) * limit]
      ),
      queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM \`Transaction\` t ${whereSQL}`, params),
    ])

    const total = totalRow?.count ?? 0

    if (isAdmin) {
      for (const t of transactions as any[]) {
        t.shop = t._shop_id ? { id: t._shop_id, name: t._shop_name } : null
        t.user = t._user_id ? { id: t._user_id, name: t._user_name } : null
        delete t._shop_id; delete t._shop_name; delete t._user_id; delete t._user_name
      }
    }

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
