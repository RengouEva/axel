import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInput, planUpdateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const planId = Number(id)

    const existing = await prisma.plan.findUnique({ where: { id: planId } })
    if (!existing) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const validation = validateInput(planUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: validation.data,
    })
    return NextResponse.json(plan)
  } catch (error) {
    console.error("[PLAN_PUT]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(_request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const planId = Number(id)

    const existing = await prisma.plan.findUnique({ where: { id: planId } })
    if (!existing) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
    }

    await prisma.plan.delete({ where: { id: planId } })
    return NextResponse.json({ message: "Plan supprimé" })
  } catch (error) {
    console.error("[PLAN_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
