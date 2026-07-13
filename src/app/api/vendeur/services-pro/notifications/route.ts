import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification } from "@/data/services-pro/notifications"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")

    const result = await getNotifications(shop.id, page)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[SERVICES_PRO_NOTIFICATIONS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const body = await request.json()
    const { action, id } = body

    if (action === 'mark_read' && id) {
      await markNotificationRead(id)
      return NextResponse.json({ success: true })
    }

    if (action === 'mark_all_read') {
      await markAllNotificationsRead(shop.id)
      return NextResponse.json({ success: true })
    }

    if (action === 'delete' && id) {
      await deleteNotification(id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
  } catch (error) {
    console.error("[SERVICES_PRO_NOTIFICATIONS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
