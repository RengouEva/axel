import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { getLoginLogs, getActionLogs } from "@/data/services-pro/security"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "actions"
    const page = parseInt(searchParams.get("page") || "1")

    if (type === "logins") {
      const logs = await getLoginLogs(auth.user.userId)
      return NextResponse.json({ logs })
    }

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const result = await getActionLogs(shop.id, page)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[SERVICES_PRO_LOGS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
