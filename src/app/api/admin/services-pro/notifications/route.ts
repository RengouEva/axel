import { NextResponse } from "next/server"
import { queryAll } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin"])
  if (!auth.success) return auth.response

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50))
  const offset = (page - 1) * limit
  const type = searchParams.get("type")

  try {
    const conditions = ["1=1"]
    const params: unknown[] = []
    if (type) { conditions.push("sn.type = ?"); params.push(type) }

    const whereSQL = "WHERE " + conditions.join(" AND ")
    const [totalRow] = await queryAll<{ count: number }>(
      `SELECT COUNT(*) as count FROM SellerNotification sn ${whereSQL}`
    )
    const total = totalRow?.count || 0
    const notifications = await queryAll<any>(
      `SELECT sn.*, s.name as shopName
       FROM SellerNotification sn
       LEFT JOIN Shop s ON s.id = sn.shopId
       ${whereSQL}
       ORDER BY sn.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    return NextResponse.json({ notifications, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}
