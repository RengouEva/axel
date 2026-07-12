export const dynamic = 'force-dynamic'

export async function GET() {
  const allVars: Record<string, string> = {}
  const keys = [
    "DATABASE_URL", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME",
    "NODE_ENV", "NEXT_PUBLIC_SITE_URL", "JWT_SECRET"
  ]
  for (const k of keys) {
    allVars[k] = process.env[k] || "NON_DEFINI"
  }

  return Response.json({
    env: allVars,
    note: "Les mots de passe sont en clair ici"
  })
}
