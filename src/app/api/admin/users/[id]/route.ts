import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const userId = Number(id)

    const user = await queryOne<any>("SELECT * FROM User WHERE id = ?", [userId])
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Impossible de supprimer un administrateur" },
        { status: 403 }
      )
    }

    await execute("DELETE FROM User WHERE id = ?", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_USER_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const userId = Number(id)

    const user = await queryOne<any>("SELECT * FROM User WHERE id = ?", [userId])
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const { role } = body

    if (role && !["client", "seller", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    await execute("UPDATE User SET role = ? WHERE id = ?", [role || user.role, userId])
    const updated = await queryOne<any>(
      "SELECT id, name, email, role, createdAt FROM User WHERE id = ?",
      [userId]
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[ADMIN_USER_PUT]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
