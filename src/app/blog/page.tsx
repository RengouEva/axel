"use client"

import { useState } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

const POSTS_PER_PAGE = 4

const allPosts = [
  { slug: "choisir-smartphone-2026", title: "Comment choisir son smartphone en 2026 ?", excerpt: "Guide complet pour trouver le smartphone idéal selon vos besoins et votre budget.", author: "AXEL Team", date: "1 Juillet 2026", category: "Conseils", image: "/images/visuel.png" },
  { slug: "paiement-credit", title: "Paiement à crédit : tout ce qu'il faut savoir", excerpt: "Découvrez comment fonctionne le crédit AXEL et comment en bénéficier.", author: "AXEL Team", date: "28 Juin 2026", category: "Crédit", image: "/images/visuel.png" },
  { slug: "tendances-tech-2026", title: "Les tendances tech de 2026", excerpt: "IA, objets connectés, nouvelles générations de smartphones... Les tendances à suivre.", author: "AXEL Team", date: "25 Juin 2026", category: "Tech", image: "/images/visuel.png" },
  { slug: "economiser-achats-en-ligne", title: "Comment économiser sur vos achats en ligne", excerpt: "Astuces et bons plans pour faire des économies sur AXEL Marketplace.", author: "AXEL Team", date: "20 Juin 2026", category: "Astuces", image: "/images/visuel.png" },
  { slug: "livraison-express", title: "Livraison express : comment ça marche ?", excerpt: "Tout savoir sur notre service de livraison rapide dans toute l'Afrique de l'Ouest.", author: "AXEL Team", date: "15 Juin 2026", category: "Livraison", image: "/images/visuel.png" },
  { slug: "garantie-prolongee", title: "Garantie prolongée : est-ce utile ?", excerpt: "Avantages et inconvénients de la garantie prolongée sur vos achats tech.", author: "AXEL Team", date: "10 Juin 2026", category: "Conseils", image: "/images/visuel.png" },
]

export default function BlogPage() {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE)
  const posts = allPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE)

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Blog AXEL</h1>
          <p className="text-[var(--text-secondary)]">Conseils, guides et actualités</p>
        </AnimatedDiv>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post, i) => (
            <AnimatedDiv key={post.slug} fade slideUp delay={i * 0.05} className="group rounded-2xl border-2 border-[var(--border)] overflow-hidden hover:shadow-axel-lg transition-all">
              <div className="aspect-video bg-[var(--bg-secondary)] overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--text-link)]/10 text-[var(--text-link)] font-medium">{post.category}</span>
                  <span>•</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-link)] transition-colors mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">{post.author}</span>
                  <Link href={`/blog/${post.slug}`} className="text-sm text-[var(--text-link)] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">Lire <ArrowRight className="w-3 h-3" /></Link>
                </div>
              </div>
            </AnimatedDiv>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: "smooth" }) }}
              disabled={page <= 1}
              className="p-2 rounded-xl border-2 border-[var(--border)] disabled:opacity-30 hover:border-[var(--border-hover)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }) }}
                className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                  p === page ? "bg-[var(--text-link)] text-white" : "border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }) }}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border-2 border-[var(--border)] disabled:opacity-30 hover:border-[var(--border-hover)] transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
