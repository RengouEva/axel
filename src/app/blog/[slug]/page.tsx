import type { Metadata } from "next"
import { Calendar, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

const posts = [
  { slug: "choisir-smartphone-2026", title: "Comment choisir son smartphone en 2026 ?", excerpt: "Guide complet pour trouver le smartphone idéal selon vos besoins et votre budget.", content: "Choisir un smartphone en 2026 peut sembler complexe face à la multitude d'offres disponibles. Voici un guide complet pour vous aider à faire le bon choix.\n\n## 1. Définissez votre budget\n\nLe premier critère est bien sûr votre budget. Chez AXEL Marketplace, nous proposons des smartphones à partir de 150 000 F jusqu'à 3 499 000 F pour les modèles les plus premium. Grâce à notre système de paiement à crédit, vous pouvez étaler vos paiements sur 3 à 36 mois.\n\n## 2. Choisissez votre OS\n\nDeux systèmes d'exploitation dominent le marché : iOS (Apple) et Android (Samsung, Xiaomi, etc.). iOS offre une expérience fluide et sécurisée, tandis qu'Android propose plus de flexibilité et de choix.\n\n## 3. Comparez les caractéristiques\n\nPrÃªtez attention à la qualité de l'écran, à l'autonomie de la batterie, à la puissance du processeur et à la qualité de l'appareil photo. Un bon smartphone en 2026 devrait avoir au moins 8 Go de RAM et 128 Go de stockage.\n\n## 4. Achetez chez AXEL\n\nUne fois votre choix fait, rendez-vous sur AXEL Marketplace pour bénéficier des meilleurs prix et de nos options de paiement flexibles.", author: "AXEL Team", date: "1 Juillet 2026", category: "Conseils", image: "/images/visuel.png" },
  { slug: "paiement-credit", title: "Paiement à crédit : tout ce qu'il faut savoir", excerpt: "Découvrez comment fonctionne le crédit AXEL et comment en bénéficier.", content: "Le paiement à crédit est une solution flexible qui vous permet d'acquérir vos produits immédiatement tout en étalant leur coût dans le temps.\n\n## Comment ça marche ?\n\n1. Choisissez votre produit sur AXEL Marketplace\n2. Sélectionnez l'option de paiement à crédit\n3. Choisissez la durée de remboursement (3 à 36 mois)\n4. Complétez votre dossier en ligne en 5 minutes\n5. Recevez votre produit sous 48h\n\n## Qui peut bénéficier d'un crédit ?\n\nToute personne majeure avec une pièce d'identité valide et des revenus réguliers peut bénéficier d'un crédit AXEL. Les taux d'intérÃªt vont de 0% à 8% selon la durée choisie.\n\n## Pourquoi choisir AXEL ?\n\n- Sans apport\n- Réponse immédiate\n- Taux transparents\n- Aucun frais caché", author: "AXEL Team", date: "28 Juin 2026", category: "Crédit", image: "/images/visuel.png" },
  { slug: "tendances-tech-2026", title: "Les tendances tech de 2026", excerpt: "IA, objets connectés, nouvelles générations de smartphones... Les tendances à suivre.", content: "L'année 2026 marque un tournant dans le monde de la technologie. Voici les tendances qui façonnent notre quotidien.\n\n## Intelligence Artificielle\n\nL'IA est désormais intégrée dans la plupart de nos appareils. Les smartphones intègrent des assistants intelligents capables d'anticiper nos besoins.\n\n## Objets connectés\n\nLa maison connectée devient la norme. Réfrigérateurs, climatiseurs, éclairage... Tout peut Ãªtre contrôlé depuis votre smartphone.\n\n## Smartphones nouvelle génération\n\nLes écrans pliables, les appareils photo 200 MP et les batteries à charge ultra-rapide sont désormais standards sur les modèles premium.\n\n## Achetez chez AXEL\n\nRetrouvez toutes ces innovations sur AXEL Marketplace aux meilleurs prix.", author: "AXEL Team", date: "25 Juin 2026", category: "Tech", image: "/images/visuel.png" },
  { slug: "economiser-achats-en-ligne", title: "Comment économiser sur vos achats en ligne", excerpt: "Astuces et bons plans pour faire des économies sur AXEL Marketplace.", content: "Faire des économies sur vos achats en ligne est plus facile que vous ne le pensez. Voici nos meilleurs conseils.\n\n## 1. Profitez des promotions\n\nAXEL Marketplace propose régulièrement des offres promotionnelles. Consultez la page Promotions pour ne rien manquer.\n\n## 2. Utilisez le paiement à crédit\n\nÉtaler vos paiements vous permet d'acquérir des produits de meilleure qualité sans impacter votre budget mensuel.\n\n## 3. Comparez les prix\n\nNotre comparateur intégré vous permet de comparer les caractéristiques et les prix de différents produits.\n\n## 4. Créez votre liste de favoris\n\nAjoutez vos produits préférés à vos favoris pour Ãªtre alerté en cas de baisse de prix.\n\n## 5. Achetez au bon moment\n\nLes meilleures offres sont souvent disponibles pendant les périodes de soldes et les fÃªtes.", author: "AXEL Team", date: "20 Juin 2026", category: "Astuces", image: "/images/visuel.png" },
]

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) return { title: "Article" }
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts.find((p) => p.slug === slug)
  if (!post) notFound()

  const paragraphs = post.content.split("\n\n")

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/blog" className="flex items-center gap-1 text-sm text-[var(--text-link)] font-semibold mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour au blog
        </Link>

        <div className="aspect-video rounded-2xl bg-[var(--bg-secondary)] overflow-hidden mb-8">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mb-4">
          <span className="px-2.5 py-1 rounded-full bg-[var(--text-link)]/10 text-[var(--text-link)] font-semibold">{post.category}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author}</span>
        </div>

        <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)] mb-6 leading-tight">{post.title}</h1>

        <article className="prose prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed space-y-4">
          {paragraphs.map((p, i) => {
            if (p.startsWith("## ")) {
              return <h2 key={i} className="text-xl font-bold text-[var(--text-primary)] mt-8 mb-3">{p.replace("## ", "")}</h2>
            }
            if (p.startsWith("- ")) {
              const items = p.split("\n").map((line) => line.replace(/^- /, "")).filter(Boolean)
              return (
                <ul key={i} className="list-disc pl-5 space-y-1">
                  {items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )
            }
            if (/^\d+\.\s/.test(p)) {
              const items = p.split("\n").map((line) => line.replace(/^\d+\.\s/, "")).filter(Boolean)
              return (
                <ol key={i} className="list-decimal pl-5 space-y-1">
                  {items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ol>
              )
            }
            return <p key={i}>{p}</p>
          })}
        </article>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">Partagez cet article</p>
          <div className="flex gap-3">
            <Link href="/blog" className="text-[var(--text-link)] font-semibold text-sm hover:underline">{"<- Article précédent"}</Link>
            <Link href={`/produits?search=${encodeURIComponent(post.category)}`} className="text-[var(--text-link)] font-semibold text-sm hover:underline">{"Voir les produits >"}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
