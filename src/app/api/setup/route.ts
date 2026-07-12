import { execSync } from "child_process"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

const PRISMA = "./node_modules/.bin/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== "axel-setup-2024") {
    return NextResponse.json({ error: "Clé invalide" }, { status: 403 })
  }

  const results: string[] = []

  try {
    const host = process.env.DB_HOST || "127.0.0.1"
    const port = process.env.DB_PORT || "3306"
    const user = process.env.DB_USER || "u658795094_axel"
    const pass = process.env.DB_PASSWORD || ""
    const name = process.env.DB_NAME || "u658795094_axel"
    const url = `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}`

    results.push("Running prisma db push...")
    execSync(`${PRISMA} db push`, { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" })
    results.push("Tables créées avec succès")

    results.push("Running prisma seed...")
    execSync("node prisma/seed.js", { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" })
    results.push("Données initialisées avec succès")

    return NextResponse.json({ success: true, logs: results })
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer; message?: string }
    return NextResponse.json({
      success: false,
      logs: results,
      error: err?.message || String(e),
      stderr: err?.stderr?.toString(),
    }, { status: 500 })
  }
}
