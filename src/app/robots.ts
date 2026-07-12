import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://axel.marketplace"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/compte/", "/vendeur/", "/admin/", "/connexion/", "/inscription/", "/mot-de-passe-oublie/", "/panier/", "/checkout/", "/notifications/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
