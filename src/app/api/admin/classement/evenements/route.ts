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
  const event = searchParams.get("event")
  const productId = searchParams.get("productId")

  try {
    const conditions = ["1=1"]
    const params: unknown[] = []
    if (event) { conditions.push("pe.event = ?"); params.push(event) }
    if (productId) { conditions.push("pe.productId = ?"); params.push(Number(productId)) }

    const whereSQL = "WHERE " + conditions.join(" AND ")

    const [totalRow] = await queryAll<{ count: number }>(
      `SELECT COUNT(*) as count FROM ProductEvent pe ${whereSQL}`
    )
    const total = totalRow?.count || 0
    const events = await queryAll<any>(
      `SELECT pe.*, p.name as productName, p.image, u.name as userName
       FROM ProductEvent pe
       LEFT JOIN Product p ON p.id = pe.productId
       LEFT JOIN User u ON u.id = pe.userId
       ${whereSQL}
       ORDER BY pe.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    return NextResponse.json({ events, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}
