const fs = require("fs")
const path = require("path")

const host = process.env.DB_HOST || "127.0.0.1"
const port = process.env.DB_PORT || "3306"
const user = process.env.DB_USER || "u658795094_axel"
const pass = process.env.DB_PASSWORD || ""
const name = process.env.DB_NAME || "u658795094_axel"
const jwtSecret = process.env.JWT_SECRET || "axel-marketplace-jwt-secret-development-key"
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axel.interdata.group"

const url = `mysql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${name}`

const content = [
  `DATABASE_URL="${url}"`,
  `JWT_SECRET="${jwtSecret}"`,
  `NEXT_PUBLIC_SITE_URL="${siteUrl}"`,
].join("\n") + "\n"

fs.writeFileSync(path.join(__dirname, "..", ".env"), content)
