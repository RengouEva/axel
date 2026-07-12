"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import Button from "@/components/ui/button"

interface Review {
  id: number
  author: string
  rating: number
  date: string
  content: string
  helpful: number
}

export default function ProductReviews() {
  const [reviews, setReviews] = useState<Review[]>([
    { id: 1, author: "Kouamé J.", rating: 5, date: "Il y a 2 jours", content: "Produit reçu en 48h exactement comme décrit. Le paiement à crédit a été très simple à mettre en place.", helpful: 24 },
    { id: 2, author: "Fatou S.", rating: 5, date: "Il y a 1 semaine", content: "Je recommande vivement. La simulation de crédit est transparente, sans frais cachés. Très satisfaite !", helpful: 18 },
    { id: 3, author: "Moussa D.", rating: 4, date: "Il y a 2 semaines", content: "Bon produit, livraison rapide. Seul bémol : le suivi de commande pourrait Ãªtre plus détaillé.", helpful: 7 },
  ])

  const [showForm, setShowForm] = useState(false)
  const [newRating, setNewRating] = useState(0)
  const [newContent, setNewContent] = useState("")
  const [hoverRating, setHoverRating] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRating || !newContent.trim()) return
    const review: Review = {
      id: Date.now(),
      author: "Vous",
      rating: newRating,
      date: "À l'instant",
      content: newContent.trim(),
      helpful: 0,
    }
    setReviews([review, ...reviews])
    setShowForm(false)
    setNewRating(0)
    setNewContent("")
  }

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">Avis clients</h3>
          <div className="flex items-center gap-2">
            <span className="text-4xl font-bold text-[var(--text-primary)]">{avgRating}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-5 h-5 ${i <= Math.round(Number(avgRating)) ? "fill-yellow-400 text-yellow-400" : "text-[var(--text-muted)]"}`} />
              ))}
            </div>
            <span className="text-sm text-[var(--text-secondary)]">({reviews.length} avis)</span>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Écrire un avis"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border-2 border-[var(--border-hover)]/20 bg-[var(--bg-secondary)] space-y-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Votre note</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setNewRating(i)} onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)}>
                  <Star className={`w-6 h-6 cursor-pointer transition-colors ${
                    i <= (hoverRating || newRating) ? "fill-yellow-400 text-yellow-400" : "text-[#D1D5DB]"
                  }`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Votre avis</p>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Partagez votre expérience avec ce produit..."
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none resize-none"
              rows={3}
              required
            />
          </div>
          <Button type="submit" disabled={!newRating || !newContent.trim()}>Publier</Button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-5 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/20 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-axel flex items-center justify-center text-white font-bold text-sm">
                  {review.author[0]}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{review.author}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-[var(--text-muted)]"}`} />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{review.date}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{review.content}</p>
            <button className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-link)] transition-colors">
              Utile ({review.helpful})
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}