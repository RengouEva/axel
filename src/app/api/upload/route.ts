import { NextResponse } from "next/server"
import { mkdir } from "fs/promises"
import { writeFile } from "fs/promises"
import path from "path"
import sharp from "sharp"
import { checkApiRateLimit } from "@/lib/rate-limit"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const rateLimit = checkApiRateLimit(`upload:${ip}`)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Type de fichier non autorisé (PNG, JPG, WEBP)" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 })
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`
    const uploadDir = path.join(process.cwd(), "public/uploads")
    const filepath = path.join(uploadDir, filename)

    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer()
    await writeFile(filepath, webpBuffer)

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 })
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error)
    return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 })
  }
}
