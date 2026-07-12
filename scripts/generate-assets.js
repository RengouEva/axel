const fs = require("fs")
const path = require("path")

const productsDir = path.join(__dirname, "..", "public", "images", "products")
const iconsDir = path.join(__dirname, "..", "public", "icons")
fs.mkdirSync(productsDir, { recursive: true })
fs.mkdirSync(iconsDir, { recursive: true })

const products = [
  { name: "iphone-16-pro-max", label: "iPhone 16 Pro Max", color: "#1a1a2e", accent: "#c0c0c0", shape: "phone" },
  { name: "macbook-pro-16-m4", label: "MacBook Pro 16\"", color: "#2d2d2d", accent: "#e0e0e0", shape: "laptop" },
  { name: "samsung-galaxy-s25-ultra", label: "Galaxy S25 Ultra", color: "#1428a0", accent: "#e0e0e0", shape: "phone" },
  { name: "tv-oled-77-lg-g5", label: "LG OLED 77\"", color: "#a50034", accent: "#1a1a1a", shape: "tv" },
  { name: "airpods-pro-3", label: "AirPods Pro 3", color: "#f5f5f5", accent: "#e0e0e0", shape: "earbuds" },
  { name: "playstation-6-pro", label: "PS6 Pro", color: "#003791", accent: "#ffffff", shape: "console" },
  { name: "montre-connectee-ultra-3", label: "Montre Ultra 3", color: "#ff6b00", accent: "#2d2d2d", shape: "watch" },
  { name: "robot-aspirateur-roomba-j9", label: "Roomba j9+", color: "#00a3e0", accent: "#333333", shape: "robot" },
]

const variants = [
  { suffix: "", bg: "#f8fafc" },
  { suffix: "-nuit", bg: "#1a1a2e" },
  { suffix: "-sable", bg: "#f5e6cc" },
  { suffix: "-azur", bg: "#e0f0ff" },
]

function svgShape(shape, color, accent, bg) {
  const isDark = bg === "#1a1a2e"
  const textColor = isDark ? "#ffffff" : bg === "#f5e6cc" ? "#5c4a3a" : bg === "#e0f0ff" ? "#1a3a5c" : "#333333"

  let shapeSvg = ""
  switch (shape) {
    case "phone":
      shapeSvg = `<rect x="160" y="60" width="180" height="340" rx="30" fill="${color}" stroke="${accent}" stroke-width="4"/>
<rect x="175" y="85" width="150" height="290" rx="10" fill="${isDark ? "#2d2d4e" : "#ffffff"}"/>
<circle cx="250" cy="390" r="6" fill="${accent}"/>
<rect x="235" y="60" width="30" height="5" rx="2.5" fill="${accent}"/>`
      break
    case "laptop":
      shapeSvg = `<rect x="100" y="70" width="300" height="200" rx="12" fill="${color}" stroke="${accent}" stroke-width="3"/>
<rect x="110" y="80" width="280" height="170" rx="6" fill="${isDark ? "#3d3d3d" : "#ffffff"}"/>
<rect x="120" y="270" width="260" height="8" rx="4" fill="${accent}"/>
<rect x="80" y="278" width="340" height="12" rx="4" fill="${color}" stroke="${accent}" stroke-width="2"/>`
      break
    case "tv":
      shapeSvg = `<rect x="60" y="50" width="380" height="240" rx="16" fill="${color}" stroke="${accent}" stroke-width="4"/>
<rect x="75" y="65" width="350" height="200" rx="8" fill="${isDark ? "#2a2a2a" : "#ffffff"}"/>
<rect x="230" y="290" width="40" height="30" fill="${color}"/>
<rect x="200" y="320" width="100" height="10" rx="5" fill="${accent}"/>`
      break
    case "earbuds":
      shapeSvg = `<ellipse cx="180" cy="240" rx="40" ry="60" fill="${color}" stroke="${accent}" stroke-width="3"/>
<ellipse cx="320" cy="240" rx="40" ry="60" fill="${color}" stroke="${accent}" stroke-width="3"/>
<rect x="185" y="180" width="30" height="80" rx="15" fill="${accent}"/>
<rect x="285" y="180" width="30" height="80" rx="15" fill="${accent}"/>
<path d="M200 200 Q250 150 300 200" fill="none" stroke="${accent}" stroke-width="4" opacity="0.5"/>`
      break
    case "console":
      shapeSvg = `<rect x="100" y="140" width="300" height="180" rx="20" fill="${color}" stroke="${accent}" stroke-width="3"/>
<rect x="120" y="160" width="260" height="120" rx="10" fill="${isDark ? "#1a4a7a" : "#ffffff"}" opacity="0.8"/>
<circle cx="190" cy="270" r="12" fill="${accent}"/>
<circle cx="210" cy="270" r="12" fill="${accent}"/>
<circle cx="290" cy="270" r="8" fill="${accent}"/>
<circle cx="310" cy="270" r="8" fill="${accent}"/>
<rect x="160" y="120" width="20" height="20" rx="5" fill="${accent}"/>
<rect x="320" y="120" width="20" height="20" rx="5" fill="${accent}"/>`
      break
    case "watch":
      shapeSvg = `<rect x="185" y="60" width="130" height="280" rx="45" fill="${color}" stroke="${accent}" stroke-width="4"/>
<rect x="200" y="85" width="100" height="230" rx="30" fill="${isDark ? "#4a4a4a" : "#ffffff"}"/>
<circle cx="250" cy="200" r="35" fill="none" stroke="${color}" stroke-width="3"/>
<line x1="250" y1="200" x2="250" y2="178" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
<line x1="250" y1="200" x2="265" y2="200" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
<rect x="235" y="275" width="30" height="8" rx="4" fill="${color}"/>
<rect x="220" y="340" width="60" height="15" rx="3" fill="${accent}"/>`
      break
    case "robot":
      shapeSvg = `<circle cx="250" cy="220" r="120" fill="${color}" stroke="${accent}" stroke-width="3"/>
<circle cx="250" cy="220" r="80" fill="${isDark ? "#1a6a8a" : "#ffffff"}" opacity="0.4"/>
<circle cx="210" cy="200" r="12" fill="${accent}"/>
<circle cx="290" cy="200" r="12" fill="${accent}"/>
<rect x="230" y="230" width="40" height="6" rx="3" fill="${accent}"/>
<circle cx="250" cy="310" r="15" fill="${accent}"/>
<circle cx="200" cy="310" r="10" fill="${accent}"/>
<circle cx="300" cy="310" r="10" fill="${accent}"/>`
      break
  }
  return shapeSvg
}

for (const p of products) {
  for (const v of variants) {
    const filename = `${p.name}${v.suffix}.svg`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 400" width="500" height="400">
  <rect width="500" height="400" fill="${v.bg}" rx="16"/>
  <g transform="translate(0, 10)">
    ${svgShape(p.shape, p.color, p.accent, v.bg)}
  </g>
  <text x="250" y="380" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="600" fill="#94a3b8">${p.label}</text>
</svg>`
    fs.writeFileSync(path.join(productsDir, filename), svg)
    console.log(`✓ ${filename}`)
  }
}

// Generate manifest icons from the existing SVG
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1769F2"/>
      <stop offset="100%" stop-color="#061A4A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <text x="256" y="310" text-anchor="middle" font-family="sans-serif" font-size="240" font-weight="900" fill="white">A</text>
</svg>`
fs.writeFileSync(path.join(iconsDir, "icon.svg"), iconSvg)

// Generate PNG icons using sharp
async function generatePngs() {
  try {
    const sharp = require("sharp")
    const sizes = [192, 384, 512]
    const svgBuffer = Buffer.from(iconSvg)
    for (const size of sizes) {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`))
      console.log(`✓ icon-${size}.png`)
    }
  } catch {
    console.log("⚠ sharp not available, creating placeholder PNGs manually")

    // Manual minimal PNG (1x1 pixel PNG scaled to size via SVG in manifest)
    // These are valid PNGs that will work as favicons
    for (const size of [192, 384, 512]) {
      const png = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG header
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // grayscale
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT
        0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x00, 0x00, // compressed data
        0x00, 0x02, 0x00, 0x01, 0xE5, 0x27, 0xDE, 0xFC, // end
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82,
      ])
      fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png)
      console.log(`✓ icon-${size}.png (placeholder)`)
    }
  }
}

generatePngs().catch(console.error)
