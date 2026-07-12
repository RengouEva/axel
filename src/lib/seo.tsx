import Script from "next/script"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://axel.marketplace"
const SITE_NAME = "AXEL Marketplace"

function sanitizeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(data) }}
      strategy="afterInteractive"
    />
  )
}

export function OrganizationSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icons/logo-512.png`,
        description: "Marketplace avec paiement comptant ou à crédit en Afrique",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+225-01-02-03-04",
          contactType: "customer service",
          availableLanguage: ["French"],
        },
        sameAs: [
          "https://facebook.com/axelmarketplace",
          "https://twitter.com/axelmarketplace",
          "https://instagram.com/axelmarketplace",
        ],
      }}
    />
  )
}

export function ProductSchema({ product }: {
  product: { name: string; brand: string; price: number; description?: string; image: string; slug: string }
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        brand: { "@type": "Brand", name: product.brand },
        description: (product.description || `${product.name} de ${product.brand} disponible sur ${SITE_NAME}`).replace(/<[^>]*>/g, ""),
        image: product.image.startsWith("http") ? product.image : `${SITE_URL}${product.image}`,
        offers: {
          "@type": "Offer",
          price: product.price / 1,
          priceCurrency: "XOF",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/produit/${product.slug}`,
        },
      }}
    />
  )
}

export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.url}`,
        })),
      }}
    />
  )
}

export function FaqSchema({ questions }: { questions: { question: string; answer: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      }}
    />
  )
}

export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/produits?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  )
}
