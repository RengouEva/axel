const { execSync } = require("child_process")
const fs = require("fs")

const host = process.env.DB_HOST || "127.0.0.1"
const port = process.env.DB_PORT || "3306"
const user = process.env.DB_USER || "u658795094_axel"
const pass = process.env.DB_PASSWORD || ""
const name = process.env.DB_NAME || "u658795094_axel"

const url = `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}`

// Write a temporary .env so prisma commands can find DATABASE_URL
const envContent = `DATABASE_URL="${url}"
JWT_SECRET="${process.env.JWT_SECRET || "axel-marketplace-jwt-secret-development-key"}"
NEXT_PUBLIC_SITE_URL="${process.env.NEXT_PUBLIC_SITE_URL || "https://axel.interdata.group"}"
`
fs.writeFileSync(".env", envContent)

execSync("npx prisma generate", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } })
