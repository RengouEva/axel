import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  const expectedKey = process.env.SETUP_SECRET_KEY

  if (!expectedKey || key !== expectedKey) {
    return NextResponse.json({ error: "Clé invalide" }, { status: 403 })
  }

  const action = searchParams.get("action") || "count"

  try {
    if (action === "count") {
      const tables = ["Product", "User", "Shop", "Category", "Country", "City", "District", "TaxRate"]
      const counts: Record<string, number> = {}
      for (const tbl of tables) {
        const row = await queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM \`${tbl}\``)
        counts[tbl] = row?.count ?? 0
      }
      const ordersRow = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM `Order`")
      counts["Order"] = ordersRow?.count ?? 0

      let products: any[] = []
      if (counts["Product"] > 0) {
        products = await queryAll<any>("SELECT name, brand, price FROM Product LIMIT 10")
      }

      return NextResponse.json({ counts, products })
    }

    if (action === "clear-products") {
      await execute("DELETE FROM ProductBoost")
      await execute("DELETE FROM Favorite")
      await execute("DELETE FROM OrderItem")
      await execute("DELETE FROM `Order`")
      await execute("DELETE FROM CreditRequest")
      await execute("DELETE FROM Product")
      return NextResponse.json({ success: true, message: "Tous les produits et données associées ont été supprimés" })
    }

    if (action === "clear-all") {
      const tables = ["Guarantor", "CreditRequest", "DeliveryMission", "DeliveryPerson", "ProductStock", "Favorite", "ProductBoost", "OrderItem", "Product", "ShopSubscription", "ShopBadge", "Transaction", "Shop", "ContactMessage", "`Order`"]
      for (const tbl of tables) {
        await execute(`DELETE FROM ${tbl}`)
      }
      return NextResponse.json({ success: true, message: "Toutes les données (produits, commandes, boutiques, etc.) ont été supprimées" })
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || String(e) }, { status: 500 })
  }
}
