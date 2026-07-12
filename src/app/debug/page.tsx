import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function DebugPage() {
  const dbUrl = process.env.DATABASE_URL || "non définie"
  const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, "//user:****@")
  const nodeEnv = process.env.NODE_ENV || "non défini"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "non défini"

  let dbStatus = "inaccessible"
  let dbError = ""
  try {
    await prisma.$connect()
    dbStatus = "connecté"
    await prisma.$disconnect()
  } catch (e: unknown) {
    const err = e as { message?: string }
    dbError = err?.message || String(e)
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Debug</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr><td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>DATABASE_URL</td><td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>{maskedUrl}</td></tr>
          <tr><td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>NODE_ENV</td><td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>{nodeEnv}</td></tr>
          <tr><td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>NEXT_PUBLIC_SITE_URL</td><td style={{ padding: "0.5rem", border: "1px solid #ccc" }}>{siteUrl}</td></tr>
          <tr><td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>Connexion DB</td><td style={{ padding: "0.5rem", border: "1px solid #ccc", color: dbStatus === "connecté" ? "green" : "red" }}>{dbStatus}</td></tr>
          {dbError && <tr><td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>Erreur DB</td><td style={{ padding: "0.5rem", border: "1px solid #ccc", color: "red", whiteSpace: "pre-wrap" }}>{dbError}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
