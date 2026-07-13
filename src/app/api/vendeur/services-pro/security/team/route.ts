import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, teamMemberSchema } from "@/lib/services-pro-validations"
import { getTeamMembers, inviteTeamMember, updateTeamMemberRole, removeTeamMember } from "@/data/services-pro/security"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const members = await getTeamMembers(shop.id)
    return NextResponse.json({ members })
  } catch (error) {
    console.error("[SERVICES_PRO_TEAM_GET]", error)
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
    const validation = validateInput(teamMemberSchema, body)
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })

    const result = await inviteTeamMember(shop.id, auth.user.userId, validation.data)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

    return NextResponse.json({ message: "Membre invité avec succès" }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_TEAM_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { id, role, permissions } = body
    if (!id || !role) return NextResponse.json({ error: "ID et rôle requis" }, { status: 400 })

    await updateTeamMemberRole(id, role, permissions)
    return NextResponse.json({ message: "Rôle mis à jour" })
  } catch (error) {
    console.error("[SERVICES_PRO_TEAM_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 })

    await removeTeamMember(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_TEAM_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
