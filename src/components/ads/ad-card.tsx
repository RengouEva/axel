"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingCart, Eye } from "lucide-react"
import { motion } from "framer-motion"
import SponsoredBadge from "./sponsored-badge"
import type { AdServingAd } from "@/lib/ads"

interface AdCardProps {
  ad: AdServingAd
  onImpression?: () => void
  onProductClick?: (ad: AdServingAd) => void
}

export default function AdCard({ ad, onImpression, onProductClick }: AdCardProps) {
  const [imageError, setImageError] = useState(false)
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    if (!clicked) {
      setClicked(true)
      fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: ad.id, placementId: ad.placementId, sessionId: ad.sessionId }),
      }).catch(() => {})
    }
    onProductClick?.(ad)
  }

  if (!ad.product) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
    >
      <Link href={`/produit/${ad.product.id}`} onClick={handleClick} className="block">
        <div className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden">
          {!imageError ? (
            <img
              src={ad.product.image}
              alt={ad.product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-secondary)]">
              <Eye className="w-8 h-8" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <SponsoredBadge />
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{ad.product.name}</p>
          <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
            {ad.product.price.toLocaleString("fr-FR")} F
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-500 font-semibold">
            <ShoppingCart className="w-3 h-3" />
            Sponsorisé
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
