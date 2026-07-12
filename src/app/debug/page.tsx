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
          {dbError && (
            <tr>
              <td style={{ fontWeight: "bold", padding: "0.5rem", border: "1px solid #ccc" }}>Erreur DB</td>
              <td style={{ padding: "0.5rem", border: "1px solid #ccc", color: "red", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{dbError}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
