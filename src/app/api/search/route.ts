import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""

    if (!q.trim()) {
      return NextResponse.json({ shops: [], products: [] })
    }

    const [shops, products] = await Promise.all([
      prisma.shop.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, slug: true, logo: true, category: true, rating: true },
        take: 5,
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { brand: { contains: q } },
          ],
        },
        select: { id: true, name: true, slug: true, image: true, price: true, shop: { select: { name: true, slug: true } } },
        take: 5,
      }),
    ])

    return NextResponse.json({ shops, products })
  } catch (error) {
    console.error("[SEARCH_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
