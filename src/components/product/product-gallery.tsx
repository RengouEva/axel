"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ImageZoom from "./image-zoom"

interface GalleryProps {
  productName: string
  images?: string[]
}

export default function ProductGallery({ productName, images: customImages }: GalleryProps) {
  const images = customImages?.length ? customImages : ["/images/visuel.png"]
  const [activeIndex, setActiveIndex] = useState(0)

  const next = () => setActiveIndex((i) => (i + 1) % images.length)
  const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length)

  return (
    <div className="space-y-4">
      <div className="relative group">
        <ImageZoom src={images[activeIndex]} alt={productName} />
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-axel hover:bg-[var(--bg-primary)]">
              <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-axel hover:bg-[var(--bg-primary)]">
              <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </>
        )}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-[var(--text-link)]" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              i === activeIndex
                ? "border-[var(--border-hover)] shadow-axel"
                : "border-[var(--border)] hover:border-[var(--border-hover)]/30"
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  )
}
