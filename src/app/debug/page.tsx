import { queryOne, queryAll } from "@/lib/db"
import { getCategories } from "@/data/categories"
import { getProducts } from "@/data/products"

export const dynamic = 'force-dynamic'

function mask(val: string | undefined): string {
  if (!val) return "non défini"
  if (val.includes("://")) return val.replace(/\/\/[^:]+:[^@]+@/, "//user:****@")
  if (val.length > 6) return val.slice(0, 3) + "****" + val.slice(-2)
  return "****"
}

export default async function DebugPage() {
  const envVars: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  }

  let dbStatus = "inaccessible"
  let dbError = ""
  let tableCounts: Record<string, number> = {}
  let catsError = ""
  let prodsError = ""
  let nCats = 0
  let nProds = 0

  try {
    const [catCount, prodCount, userCount, shopCount, planCount, countryCount, cityCount, districtCount, taxCount] = await Promise.all([
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Category"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Product"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM User"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Shop"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Plan"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM Country"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM City"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM District"),
      queryOne<{ count: number }>("SELECT COUNT(*) as count FROM TaxRate"),
    ])
    dbStatus = "connecté"
    tableCounts["categories"] = catCount?.count ?? 0
    tableCounts["products"] = prodCount?.count ?? 0
    tableCounts["users"] = userCount?.count ?? 0
    tableCounts["shops"] = shopCount?.count ?? 0
    tableCounts["plans"] = planCount?.count ?? 0
    tableCounts["countries"] = countryCount?.count ?? 0
    tableCounts["cities"] = cityCount?.count ?? 0
    tableCounts["districts"] = districtCount?.count ?? 0
    tableCounts["taxRates"] = taxCount?.count ?? 0

    try {
      const cats = await getCategories()
      nCats = cats.length
    } catch (e: unknown) {
      catsError = (e as { message?: string }).message || String(e)
    }

    try {
      const prods = await getProducts()
      nProds = prods.length
    } catch (e: unknown) {
      prodsError = (e as { message?: string }).message || String(e)
    }
  } catch (e: unknown) {
    const err = e as { message?: string }
    dbError = err?.message || String(e)
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Debug</h1>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "0.5rem", border: "1px solid #ccc", textAlign: "left" }}>Variable</th>
            <th style={{ padding: "0.5rem", border: "1px solid #ccc", textAlign: "left" }}>Valeur</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(envVars).map(([key, val]) => (
            <tr key={key}>
              <td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>{key}</td>
              <td style={{ padding: "0.5rem", border: "1px solid #ccc", wordBreak: "break-all" }}>{mask(val)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1rem" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "0.5rem", border: "1px solid #ccc", textAlign: "left" }}>Table</th>
            <th style={{ padding: "0.5rem", border: "1px solid #ccc", textAlign: "left" }}>Lignes</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(tableCounts).map(([key, val]) => (
            <tr key={key}>
              <td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>{key}</td>
              <td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>{val}</td>
            </tr>
          ))}
          <tr>
            <td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>getCategories()</td>
            <td style={{ padding: "0.5rem", border: "1px solid #ccc", color: catsError ? "red" : "green" }}>{catsError || nCats + " catégories"}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>getProducts()</td>
            <td style={{ padding: "0.5rem", border: "1px solid #ccc", color: prodsError ? "red" : "green" }}>{prodsError || nProds + " produits"}</td>
          </tr>
        </tbody>
      </table>

      {dbError && (
        <div style={{ padding: "0.5rem", border: "1px solid #ccc", color: "red", marginTop: "1rem" }}>
          <strong>Erreur: </strong>{dbError}
        </div>
      )}
    </div>
  )
}
