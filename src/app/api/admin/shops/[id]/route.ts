import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/require-auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        },
        badges: true,
        boosts: {
          include: {
            product: { select: { id: true, name: true, slug: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { products: true } },
      },
    })

    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }

    return NextResponse.json(shop)
  } catch (error) {
    console.error("[ADMIN_SHOP_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params

    const shop = await prisma.shop.findUnique({ where: { id } })
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }

    await prisma.shop.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_SHOP_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
