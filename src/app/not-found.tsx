import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import Button from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center px-4 max-w-md">
        <div className="w-24 h-24 rounded-3xl gradient-axel flex items-center justify-center mx-auto mb-6">
          <Search className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Page introuvable</h2>
        <p className="text-[var(--text-secondary)] mb-8">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button size="lg">
              <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
            </Button>
          </Link>
          <Link href="/produits">
            <Button variant="outline" size="lg">
              Voir les produits
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
