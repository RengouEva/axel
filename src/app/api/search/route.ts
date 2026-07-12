import { NextResponse } from "next/server"
import { queryAll } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""

    if (!q.trim()) {
      return NextResponse.json({ shops: [], products: [] })
    }

    const likeParam = `%${q}%`

    const [shops, products] = await Promise.all([
      queryAll<any>(
        "SELECT id, name, slug, logo, category, rating FROM Shop WHERE name LIKE ? LIMIT 5",
        [likeParam]
      ),
      queryAll<any>(
        `SELECT p.id, p.name, p.slug, p.image, p.price, s.name as _shop_name, s.slug as _shop_slug
         FROM Product p LEFT JOIN Shop s ON s.id = p.shopId
         WHERE p.name LIKE ? OR p.brand LIKE ? LIMIT 5`,
        [likeParam, likeParam]
      ),
    ])

    const mappedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      price: p.price,
      shop: { name: p._shop_name, slug: p._shop_slug },
    }))

    return NextResponse.json({ shops, products: mappedProducts })
  } catch (error) {
    console.error("[SEARCH_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
