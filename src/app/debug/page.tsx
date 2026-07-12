import { prisma } from "@/lib/prisma"

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
  let productError = ""

  try {
    await prisma.$connect()
    dbStatus = "connecté"
    tableCounts["categories"] = await prisma.category.count()
    tableCounts["products"] = await prisma.product.count()
    tableCounts["users"] = await prisma.user.count()
    tableCounts["shops"] = await prisma.shop.count()
    tableCounts["plans"] = await prisma.plan.count()
    tableCounts["countries"] = await prisma.country.count()
    tableCounts["cities"] = await prisma.city.count()
    tableCounts["districts"] = await prisma.district.count()
    tableCounts["taxRates"] = await prisma.taxRate.count()

    try {
      const products = await prisma.product.findMany({ take: 2, include: { shop: true } })
      if (products.length > 0) {
        productError = "OK - premier produit: " + products[0].name
      } else {
        productError = "Aucun produit trouvé"
      }
    } catch (e: unknown) {
      productError = "Erreur getProducts: " + (e as { message?: string }).message
    }

    await prisma.$disconnect()
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
          <tr>
            <td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>Connexion DB</td>
            <td style={{ padding: "0.5rem", border: "1px solid #ccc", color: dbStatus === "connecté" ? "green" : "red" }}>{dbStatus}</td>
          </tr>
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
        </tbody>
      </table>

      {productError && (
        <div style={{ padding: "0.5rem", border: "1px solid #ccc", background: "#f9f9f9" }}>
          <strong>Test produit: </strong>{productError}
        </div>
      )}

      {dbError && (
        <div style={{ padding: "0.5rem", border: "1px solid #ccc", color: "red", marginTop: "1rem" }}>
          <strong>Erreur: </strong>{dbError}
        </div>
      )}
    </div>
  )
}
