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
  const type = searchParams.get("type") || "all"

  try {
    let data: any[] = []
    let total = 0

    if (type === "login" || type === "all") {
      const [totalRow] = await queryAll<{ count: number }>("SELECT COUNT(*) as count FROM LoginLog")
      total += totalRow?.count || 0
      const logs = await queryAll<any>(
        `SELECT ll.*, u.name as userName, u.email as userEmail
         FROM LoginLog ll LEFT JOIN User u ON u.id = ll.userId
         ORDER BY ll.id DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      )
      data = logs.map(l => ({ ...l, _type: "login" }))
    }

    if (type === "action" || type === "all") {
      const [totalRow] = await queryAll<{ count: number }>("SELECT COUNT(*) as count FROM ActionLog")
      total += totalRow?.count || 0

      if (type === "action") {
        const logs = await queryAll<any>(
          `SELECT al.*, u.name as userName, u.email as userEmail, s.name as shopName
           FROM ActionLog al
           LEFT JOIN User u ON u.id = al.userId
           LEFT JOIN Shop s ON s.id = al.shopId
           ORDER BY al.id DESC LIMIT ? OFFSET ?`,
          [limit, offset]
        )
        data = logs.map(l => ({ ...l, _type: "action" }))
      } else {
        const logs = await queryAll<any>(
          `SELECT al.*, u.name as userName, u.email as userEmail, s.name as shopName
           FROM ActionLog al
           LEFT JOIN User u ON u.id = al.userId
           LEFT JOIN Shop s ON s.id = al.shopId
           ORDER BY al.id DESC LIMIT ? OFFSET ?`,
          [limit, offset]
        )
        data = [...data, ...logs.map(l => ({ ...l, _type: "action" }))]
        data.sort((a, b) => b.id - a.id)
        data = data.slice(offset, offset + limit)
      }
    }

    return NextResponse.json({ logs: data, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}
