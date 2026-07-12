import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Impossible de supprimer un administrateur" },
        { status: 403 }
      )
    }

    await prisma.user.delete({ where: { id: userId } })

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

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const { role } = body

    if (role && !["client", "seller", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role || user.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[ADMIN_USER_PUT]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
