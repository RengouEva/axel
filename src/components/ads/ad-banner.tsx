"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import SponsoredBadge from "./sponsored-badge"
import type { AdServingAd } from "@/lib/ads"

interface AdBannerProps {
  ad: AdServingAd
  height?: string
}

export default function AdBanner({ ad, height = "h-24 sm:h-28" }: AdBannerProps) {
  const [clicked, setClicked] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    if (!clicked) {
      setClicked(true)
      fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: ad.id, placementId: ad.placementId, sessionId: ad.sessionId }),
      }).catch(() => {})
    }
  }

  if (!ad.bannerImage && !ad.product) return null

  const href = ad.targetUrl || "#"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10"
    >
      <Link href={href} onClick={handleClick} className="block relative w-full">
        {ad.bannerImage && !imageError ? (
          <img
            src={ad.bannerImage}
            alt="Publicité"
            className={`w-full ${height} object-cover`}
            onError={() => setImageError(true)}
          />
        ) : ad.product ? (
          <div className={`w-full ${height} flex items-center justify-center px-6`}>
            <div className="flex items-center gap-4">
              <img src={ad.product.image} alt={ad.product.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover" />
              <div className="text-left">
                <p className="text-sm font-bold text-[var(--text-primary)]">{ad.product.name}</p>
                <p className="text-lg font-black text-amber-500">{ad.product.price.toLocaleString("fr-FR")} F</p>
              </div>
            </div>
          </div>
        ) : null}
        <div className="absolute top-2 right-2">
          <SponsoredBadge />
        </div>
      </Link>
    </motion.div>
  )
}
