import Link from "next/link"

const socialLinks = [
  { name: "Facebook", href: "https://facebook.com/axelmarketplace", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { name: "X", href: "https://x.com/axelmarketplace", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { name: "Instagram", href: "https://instagram.com/axelmarketplace", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
  { name: "LinkedIn", href: "https://linkedin.com/company/axelmarketplace", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  { name: "YouTube", href: "https://youtube.com/@axelmarketplace", icon: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
]

export default function Footer() {
  const columns = [
    {
      title: "AXEL",
      links: [
        { label: "À propos", href: "/a-propos" },
        { label: "Carrières", href: "/contact" },
        { label: "Presse", href: "/blog" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Acheter",
      links: [
        { label: "Comment ça marche", href: "/a-credit" },
        { label: "Paiement comptant", href: "/produits" },
        { label: "Paiement à crédit", href: "/a-credit" },
        { label: "Promotions", href: "/promotions" },
        { label: "Nouveautés", href: "/nouveautes" },
      ],
    },
    {
      title: "Vendre",
      links: [
        { label: "Devenir vendeur", href: "/vendeur" },
        { label: "Espace vendeur", href: "/vendeur" },
        { label: "Centre d'aide", href: "/faq" },
      ],
    },
    {
      title: "Assistance",
      links: [
        { label: "Centre d'aide", href: "/faq" },
        { label: "FAQ", href: "/faq" },
        { label: "Livraison", href: "/livraison" },
        { label: "Retours", href: "/faq" },
      ],
    },
    {
      title: "Légal",
      links: [
        { label: "CGU", href: "/cgu" },
        { label: "Confidentialité", href: "/confidentialite" },
        { label: "Cookies", href: "/confidentialite" },
        { label: "Mentions légales", href: "/cgu" },
      ],
    },
  ]

  const payments = [
    { name: "Visa", sub: [] },
    { name: "Mastercard", sub: [] },
    { name: "IrisPay", sub: ["Orange Money", "MTN Mobile Money", "Wave", "Moov", "PayPal"] },
  ]

  return (
    <footer className="bg-[var(--bg-inverse)] text-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6 lg:gap-12">
          <div className="col-span-full lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <img
                src="/images/logo-axel.png"
                alt="AXEL"
                className="h-14 sm:h-16 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6 max-w-xs">
              La marketplace qui rend vos achats accessibles, simples et sécurisés.
              Paiement comptant ou à crédit.
            </p>
            <div className="flex gap-2 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all hover:scale-110 group"
                  title={social.name}
                >
                  <svg className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-sm mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-auto">
              <p className="text-sm text-[var(--text-secondary)] mb-3 text-center md:text-left">Moyens de paiement acceptés</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {payments.map((p) => (
                  <div key={p.name} className="relative group">
                    <span className="inline-block px-3 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-white/60 cursor-default">
                      {p.name}
                    </span>
                    {p.sub.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                        <div className="bg-white/10 backdrop-blur-xl rounded-lg px-3 py-2 text-[10px] text-white/80 whitespace-nowrap border border-white/10 shadow-xl">
                          <p className="text-[9px] text-white/50 mb-1">Via IrisPay :</p>
                          {p.sub.map((s) => (
                            <span key={s} className="block py-0.5">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="flex gap-3">
                <a
                  href="https://apps.apple.com/app/axel-marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  App Store
                </a>
                <a
                  href="https://play.google.com/store/apps/developer?name=AXEL+Marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-sm hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.59.69.59 1.19s-.25.92-.59 1.19l-2.92 1.66-2.47-2.47 2.47-2.47 2.92 1.66zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z"/></svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} AXEL Marketplace. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
