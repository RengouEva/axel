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

  try {
    const [totalRow] = await queryAll<{ count: number }>("SELECT COUNT(*) as count FROM ApiKey")
    const total = totalRow?.count || 0
    const keys = await queryAll<any>(
      `SELECT ak.*, s.name as shopName
       FROM ApiKey ak
       LEFT JOIN Shop s ON s.id = ak.shopId
       ORDER BY ak.createdAt DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    return NextResponse.json({ keys, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}
