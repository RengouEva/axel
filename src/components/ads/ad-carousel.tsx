"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import AdCard from "./ad-card"
import type { AdServingAd } from "@/lib/ads"

interface AdCarouselProps {
  ads: AdServingAd[]
  title?: string
}

export default function AdCarousel({ ads, title = "Sponsorisé" }: AdCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  if (!ads.length) return null

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = 300
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">{title}</p>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory"
      >
        {ads.map((ad) => (
          <div key={ad.id} className="w-44 shrink-0 snap-start">
            <AdCard ad={ad} />
          </div>
        ))}
      </div>
    </div>
  )
}
