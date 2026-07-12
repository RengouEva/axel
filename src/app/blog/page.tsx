import { AnimatedDiv } from "@/lib/animations"

export default function BlogPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <AnimatedDiv fade slideUp>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Blog AXEL</h1>
          <p className="text-[var(--text-secondary)] mb-8">Conseils, guides et actualités</p>
          <p className="text-[var(--text-secondary)]">Aucun article pour le moment. Revenez bientôt !</p>
        </AnimatedDiv>
      </div>
    </div>
  )
}
