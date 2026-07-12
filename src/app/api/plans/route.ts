import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInput, planCreateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "true"

    if (all) {
      const auth = await requireRole(request, ["admin"])
      if (!auth.success) return auth.response

      const plans = await prisma.plan.findMany({ orderBy: { price: "asc" } })
      return NextResponse.json(plans)
    }

    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    })
    return NextResponse.json(plans)
  } catch (error) {
    console.error("[PLANS_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const validation = validateInput(planCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const plan = await prisma.plan.create({ data: validation.data })
    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error("[PLANS_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
