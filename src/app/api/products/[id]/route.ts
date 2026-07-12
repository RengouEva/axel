import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInput, productUpdateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const body = await request.json()
    const validation = validateInput(productUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: validation.data,
      include: { shop: { select: { id: true, name: true, slug: true, logo: true, category: true } } },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PRODUCT_PUT]", error)
    return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    await prisma.product.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error)
    return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 })
  }
}
