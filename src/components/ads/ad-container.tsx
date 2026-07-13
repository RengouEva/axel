"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import AdCard from "./ad-card"
import AdBanner from "./ad-banner"
import AdCarousel from "./ad-carousel"
import type { AdServingAd, AdSlot } from "@/lib/ads"

interface AdContainerProps {
  slot: AdSlot
  country?: string
  category?: string
  city?: string
  limit?: number
  variant?: "card" | "banner" | "carousel"
  excludeIds?: number[]
  className?: string
  title?: string
}

export default function AdContainer({
  slot, country, category, city, limit = 3,
  variant = "card", excludeIds, className = "", title,
}: AdContainerProps) {
  const [ads, setAds] = useState<AdServingAd[]>([])
  const [loading, setLoading] = useState(true)
  const fetched = useRef(false)

  const fetchAds = useCallback(async () => {
    if (fetched.current) return
    fetched.current = true

    try {
      const params = new URLSearchParams({ slot, limit: String(limit) })
      if (country) params.set("country", country)
      if (category) params.set("category", category)
      if (city) params.set("city", city)
      if (excludeIds?.length) params.set("exclude", excludeIds.join(","))

      const res = await fetch(`/api/ads/serve?${params}`)
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setAds(data.ads || [])
    } catch {}
    setLoading(false)
  }, [slot, country, category, city, limit, excludeIds])

  useEffect(() => { fetchAds() }, [fetchAds])

  if (loading || !ads.length) return null

  if (variant === "banner") {
    return <div className={className}><AdBanner ad={ads[0]} /></div>
  }

  if (variant === "carousel") {
    return <div className={className}><AdCarousel ads={ads} title={title} /></div>
  }

  return (
    <div className={className}>
      {title && (
        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">{title}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </div>
  )
}
