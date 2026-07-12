const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const { v4: uuidv4 } = require("uuid")

const prisma = new PrismaClient()

async function main() {
  console.log("🧹 Nettoyage des données...")
  await prisma.contactMessage.deleteMany()
  await prisma.guarantor.deleteMany()
  await prisma.creditRequest.deleteMany()
  await prisma.shopBadge.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.productBoost.deleteMany()
  await prisma.shopSubscription.deleteMany()
  await prisma.deliveryMission.deleteMany()
  await prisma.deliveryPerson.deleteMany()
  await prisma.productStock.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.shop.deleteMany()
  await prisma.category.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.user.deleteMany()
  await prisma.taxRate.deleteMany()
  await prisma.district.deleteMany()
  await prisma.city.deleteMany()
  await prisma.country.deleteMany()

  console.log("🌍 Création des pays...")
  const country = await prisma.country.create({
    data: { id: "CM", name: "Cameroun", flag: "🇨🇲" },
  })

  console.log("🏙️ Création des villes...")
  const cities = await Promise.all([
    prisma.city.create({ data: { id: "DLA", name: "Douala", countryId: "CM", x: 320, y: 320 } }),
    prisma.city.create({ data: { id: "YDE", name: "Yaoundé", countryId: "CM", x: 360, y: 290 } }),
    prisma.city.create({ data: { id: "GAR", name: "Garoua", countryId: "CM", x: 340, y: 200 } }),
    prisma.city.create({ data: { id: "BMD", name: "Bamenda", countryId: "CM", x: 280, y: 270 } }),
    prisma.city.create({ data: { id: "MRA", name: "Maroua", countryId: "CM", x: 370, y: 180 } }),
  ])

  console.log("🏘️ Création des districts...")
  await Promise.all([
    prisma.district.create({ data: { id: "DLA-BN", name: "Bonabéri", cityId: "DLA", x: 310, y: 325 } }),
    prisma.district.create({ data: { id: "DLA-CT", name: "Douala Centre", cityId: "DLA", x: 320, y: 320 } }),
    prisma.district.create({ data: { id: "DLA-AK", name: "Akwa", cityId: "DLA", x: 325, y: 315 } }),
    prisma.district.create({ data: { id: "DLA-DD", name: "Deido", cityId: "DLA", x: 330, y: 322 } }),
    prisma.district.create({ data: { id: "YDE-CT", name: "Yaoundé Centre", cityId: "YDE", x: 360, y: 290 } }),
    prisma.district.create({ data: { id: "YDE-MF", name: "Mfoundi", cityId: "YDE", x: 355, y: 285 } }),
    prisma.district.create({ data: { id: "YDE-NK", name: "Nkolbisson", cityId: "YDE", x: 365, y: 295 } }),
    prisma.district.create({ data: { id: "YDE-MV", name: "Mvog-Mbi", cityId: "YDE", x: 362, y: 288 } }),
    prisma.district.create({ data: { id: "GAR-CT", name: "Garoua Centre", cityId: "GAR", x: 340, y: 200 } }),
    prisma.district.create({ data: { id: "BMD-CT", name: "Bamenda Centre", cityId: "BMD", x: 280, y: 270 } }),
    prisma.district.create({ data: { id: "MRA-CT", name: "Maroua Centre", cityId: "MRA", x: 370, y: 180 } }),
  ])

  console.log("💰 Création des taxes...")
  await prisma.taxRate.create({
    data: { id: 1, countryId: "CM", rate: 19.25, label: "TVA Cameroun" },
  })

  console.log("📁 Création des catégories...")
  await Promise.all([
    prisma.category.create({ data: { id: 1, name: "Téléphones", slug: "telephones", icon: "Smartphone" } }),
    prisma.category.create({ data: { id: 2, name: "Ordinateurs", slug: "ordinateurs", icon: "Laptop" } }),
    prisma.category.create({ data: { id: 3, name: "TV", slug: "tv", icon: "Tv" } }),
    prisma.category.create({ data: { id: 4, name: "Électroménager", slug: "electromenager", icon: "Refrigerator" } }),
    prisma.category.create({ data: { id: 5, name: "Mode", slug: "mode", icon: "Shirt" } }),
    prisma.category.create({ data: { id: 6, name: "Beauté", slug: "beaute", icon: "Sparkles" } }),
    prisma.category.create({ data: { id: 7, name: "Maison", slug: "maison", icon: "Home" } }),
    prisma.category.create({ data: { id: 8, name: "Sport", slug: "sport", icon: "Trophy" } }),
    prisma.category.create({ data: { id: 9, name: "Auto", slug: "auto", icon: "Car" } }),
    prisma.category.create({ data: { id: 10, name: "Immobilier", slug: "immobilier", icon: "Building2" } }),
    prisma.category.create({ data: { id: 11, name: "Supermarché", slug: "supermarche", icon: "ShoppingCart" } }),
    prisma.category.create({ data: { id: 12, name: "Services", slug: "services", icon: "Wrench" } }),
  ])

  console.log("📦 Création des utilisateurs...")
  const hashedPassword = await bcrypt.hash("Password123", 12)
  const admin = await prisma.user.create({
    data: { name: "Admin AXEL", email: "admin@axel.marketplace", password: hashedPassword, role: "admin" },
  })
  const seller = await prisma.user.create({
    data: { name: "Vendeur AXEL", email: "seller@axel.marketplace", password: hashedPassword, role: "seller" },
  })
  await prisma.user.create({
    data: { name: "Client Test", email: "client@axel.marketplace", password: hashedPassword, role: "client" },
  })

  console.log("🏪 Création de la boutique...")
  const shop = await prisma.shop.create({
    data: {
      id: "SHOP-001",
      sellerId: seller.id,
      name: "AXEL Tech Store",
      slug: "axel-tech-store",
      description: "Boutique officielle AXEL - Téléphones, ordinateurs et accessoires high-tech au Cameroun.",
      phone: "+237 6 70 00 01 00",
      email: "store@axel.marketplace",
      logo: "/images/shops/axel-tech.svg",
      coverImage: "/images/shops/cover-tech.svg",
      countryId: "CM",
      cityId: "DLA",
      districtId: "DLA-CT",
      address: "Boulevard de la République, Douala Centre",
      rating: 4.8,
      totalSales: 1250,
    },
  })

  console.log("📱 Création des produits...")
  const productsData = [
    { id: 1, name: "iPhone 16 Pro Max", brand: "Apple", category: "Téléphones", price: 1599000, monthlyPrice: 44417, rating: 4.9, reviews: 234, promotion: true, slug: "iphone-16-pro-max", creditRates: '{"3":0,"6":0,"12":3,"18":5,"24":5,"36":8}' },
    { id: 2, name: "MacBook Pro 16\" M4", brand: "Apple", category: "Ordinateurs", price: 3499000, monthlyPrice: 97200, rating: 4.8, reviews: 189, promotion: false, slug: "macbook-pro-16-m4" },
    { id: 3, name: "Samsung Galaxy S25 Ultra", brand: "Samsung", category: "Téléphones", price: 1399000, monthlyPrice: 38861, rating: 4.7, reviews: 156, promotion: true, slug: "samsung-galaxy-s25-ultra" },
    { id: 4, name: "TV OLED 77\" LG G5", brand: "LG", category: "TV", price: 2499000, monthlyPrice: 69417, rating: 4.9, reviews: 89, promotion: false, slug: "tv-oled-77-lg-g5" },
    { id: 5, name: "AirPods Pro 3", brand: "Apple", category: "Téléphones", price: 299000, monthlyPrice: 8306, rating: 4.8, reviews: 312, promotion: true, slug: "airpods-pro-3" },
    { id: 6, name: "PlayStation 6 Pro", brand: "Sony", category: "Sport", price: 899000, monthlyPrice: 24972, rating: 4.6, reviews: 67, promotion: false, slug: "playstation-6-pro", inStock: false },
    { id: 7, name: "Montre Connectée Ultra 3", brand: "AXEL Tech", category: "Téléphones", price: 459000, monthlyPrice: 12750, rating: 4.5, reviews: 445, promotion: true, slug: "montre-connectee-ultra-3" },
    { id: 8, name: "Robot Aspirateur Roomba j9+", brand: "iRobot", category: "Maison", price: 699000, monthlyPrice: 19417, rating: 4.4, reviews: 178, promotion: false, slug: "robot-aspirateur-roomba-j9" },
  ]

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        monthlyPrice: p.monthlyPrice,
        rating: p.rating,
        reviews: p.reviews,
        inStock: p.inStock !== undefined ? p.inStock : true,
        promotion: p.promotion,
        image: `/images/products/${p.slug}.svg`,
        images: JSON.stringify([
          `/images/products/${p.slug}.svg`,
          `/images/products/${p.slug}-nuit.svg`,
          `/images/products/${p.slug}-sable.svg`,
          `/images/products/${p.slug}-azur.svg`,
        ]),
        slug: p.slug,
        creditRates: p.creditRates || null,
        shopId: shop.id,
      },
    })

    // Seed product stock
    const stockEntries = []
    if (p.slug === "iphone-16-pro-max") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-CT", quantity: 5 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-AK", quantity: 3 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-CT", quantity: 4 })
    } else if (p.slug === "macbook-pro-16-m4") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-CT", quantity: 2 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-CT", quantity: 3 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-BN", quantity: 1 })
    } else if (p.slug === "samsung-galaxy-s25-ultra") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-CT", quantity: 8 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-MF", quantity: 6 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "GAR", districtId: "GAR-CT", quantity: 2 })
    } else if (p.slug === "tv-oled-77-lg-g5") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-CT", quantity: 2 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-CT", quantity: 1 })
    } else if (p.slug === "airpods-pro-3") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-AK", quantity: 15 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-DD", quantity: 10 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-NK", quantity: 12 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "BMD", districtId: "BMD-CT", quantity: 4 })
    } else if (p.slug === "playstation-6-pro") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-CT", quantity: 0 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-CT", quantity: 0 })
    } else if (p.slug === "montre-connectee-ultra-3") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-AK", quantity: 20 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-MV", quantity: 15 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "GAR", districtId: "GAR-CT", quantity: 8 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "MRA", districtId: "MRA-CT", quantity: 5 })
    } else if (p.slug === "robot-aspirateur-roomba-j9") {
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "DLA", districtId: "DLA-DD", quantity: 6 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "YDE", districtId: "YDE-MF", quantity: 4 })
      stockEntries.push({ productId: product.id, countryId: "CM", cityId: "BMD", districtId: "BMD-CT", quantity: 2 })
    }

    if (stockEntries.length > 0) {
      await prisma.productStock.createMany({ data: stockEntries })
    }
  }

  console.log("⭐ Création des plans...")
  await Promise.all([
    prisma.plan.create({ data: { id: 1, name: "Gratuit", slug: "gratuit", description: "Pour démarrer", price: 0, durationDays: 9999, maxBoosts: 0, hasPremiumBadge: false, hasVerifiedBadge: false, hasFeaturedBadge: false, boostPrice: 5000 } }),
    prisma.plan.create({ data: { id: 2, name: "Essentiel", slug: "essentiel", description: "Pour les boutiques en croissance", price: 15000, durationDays: 30, maxBoosts: 5, hasPremiumBadge: false, hasVerifiedBadge: true, hasFeaturedBadge: false, boostPrice: 4500 } }),
    prisma.plan.create({ data: { id: 3, name: "Premium", slug: "premium", description: "Pour les boutiques établies", price: 35000, durationDays: 30, maxBoosts: 15, hasPremiumBadge: true, hasVerifiedBadge: true, hasFeaturedBadge: true, boostPrice: 3500 } }),
    prisma.plan.create({ data: { id: 4, name: "Enterprise", slug: "enterprise", description: "Pour les grandes enseignes", price: 75000, durationDays: 30, maxBoosts: -1, hasPremiumBadge: true, hasVerifiedBadge: true, hasFeaturedBadge: true, boostPrice: 2500 } }),
  ])

  console.log("✅ Seed terminé avec succès !")
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
