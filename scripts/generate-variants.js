const fs = require("fs")
const path = require("path")

const dir = "public/images/products"
const products = fs.readdirSync(dir).filter(f => f.endsWith(".svg"))

const themes = [
  { name: "nuit", bg: "#0A0A0A", accent: "#1a1a2e", text: "#FFFFFF" },
  { name: "sable", bg: "#F5EDE3", accent: "#D4A574", text: "#333333" },
  { name: "azur", bg: "#E8F4FD", accent: "#4A90D9", text: "#1A365D" },
]

products.forEach(file => {
  const svg = fs.readFileSync(path.join(dir, file), "utf-8")
  const baseName = file.replace(".svg", "")

  themes.forEach((theme, i) => {
    const variant = svg
      .replace(/<rect width="400" height="400" fill="#[^"]+"/, `<rect width="400" height="400" fill="${theme.bg}"`)
      .replace(/<rect[^>]*fill="#[^"]+"/g, (match) => {
        if (match.includes('width="400" height="400"')) return match
        return match.replace(/fill="#[^"]+"/, `fill="${theme.accent}"`)
      })
      .replace(/<text[^>]*fill="#[^"]+"/g, (match) => match.replace(/fill="#[^"]+"/, `fill="${theme.text}"`))

    fs.writeFileSync(path.join(dir, `${baseName}-${theme.name}.svg`), variant)
  })
})

console.log(`Generated ${products.length * themes.length} variants for ${products.length} products`)
