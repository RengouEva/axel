import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne, execute } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const body = await request.json()
    const { products, format } = body

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "Aucun produit à importer" }, { status: 400 })
    }

    let imported = 0
    let errors: string[] = []

    for (const row of products) {
      try {
        const name = row.name || row.Nom || row.nom
        const price = parseInt(row.price || row.Prix || row.prix || "0")
        const brand = row.brand || row.Marque || row.marque || "Générique"
        const category = row.category || row.Catégorie || row.categorie || shop.category || "Autres"

        if (!name || !price) {
          errors.push(`Ligne ${imported + 1}: Nom ou prix manquant`)
          continue
        }

        const slug = name.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

        const now = new Date()
        const months = 36
        await execute(
          `INSERT INTO Product (name, brand, category, price, monthlyPrice, description, image, images,
            creditRates, slug, shopId, inStock, promotion, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, brand, category, price, Math.round(price / months),
           row.description || row.Description || null,
           row.image || "/images/visuel.png",
           JSON.stringify([row.image || "/images/visuel.png"]),
           JSON.stringify({ "3": 0, "6": 0, "12": 3, "18": 5, "24": 5, "36": 8 }),
           `${slug}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
           shop.id, true, false, now, now]
        )
        imported++
      } catch (err) {
        errors.push(`Erreur ligne ${imported + 1}: ${err instanceof Error ? err.message : "Erreur inconnue"}`)
      }
    }

    return NextResponse.json({
      message: `${imported} produit(s) importé(s) avec succès`,
      imported,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("[SERVICES_PRO_IMPORT_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
