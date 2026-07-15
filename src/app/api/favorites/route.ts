import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (productId) {
      const fav = await queryOne<any>(
        "SELECT id FROM Favorite WHERE userId = ? AND productId = ?",
        [auth.user.userId, Number(productId)]
      )
      return NextResponse.json({ isFavorite: !!fav })
    }

    const favorites = await queryAll<any>(
      `SELECT f.id, f.productId, f.createdAt, p.id, p.name, p.brand, p.category, p.price,
              p.monthlyPrice, p.image, p.images, p.slug, p.promotion, p.inStock,
              p.creditRates, p.rating, p.reviews
       FROM Favorite f
       JOIN Product p ON p.id = f.productId
       WHERE f.userId = ?
       ORDER BY f.createdAt DESC`,
      [auth.user.userId]
    )

    const mapped = favorites.map((f: any) => ({
      id: f.productId,
      name: f.name,
      brand: f.brand,
      category: f.category,
      price: f.price,
      monthlyPrice: f.monthlyPrice,
      image: f.image,
      images: typeof f.images === "string" ? JSON.parse(f.images) : (f.images ?? []),
      slug: f.slug,
      promotion: Boolean(f.promotion),
      inStock: Boolean(f.inStock),
      creditRates: f.creditRates ?? undefined,
      rating: f.rating,
      reviews: f.reviews,
      favoritedAt: f.createdAt,
    }))

    return NextResponse.json({ favorites: mapped, total: mapped.length })
  } catch (error) {
    console.error("[FAVORITES_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { productId } = await request.json()
    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 })
    }

    const existing = await queryOne<any>(
      "SELECT id FROM Favorite WHERE userId = ? AND productId = ?",
      [auth.user.userId, productId]
    )
    if (existing) {
      return NextResponse.json({ message: "Déjà dans les favoris" })
    }

    await execute(
      "INSERT INTO Favorite (userId, productId) VALUES (?, ?)",
      [auth.user.userId, productId]
    )

    return NextResponse.json({ success: true, message: "Ajouté aux favoris" }, { status: 201 })
  } catch (error) {
    console.error("[FAVORITES_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 })
    }

    await execute(
      "DELETE FROM Favorite WHERE userId = ? AND productId = ?",
      [auth.user.userId, Number(productId)]
    )

    return NextResponse.json({ success: true, message: "Retiré des favoris" })
  } catch (error) {
    console.error("[FAVORITES_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
