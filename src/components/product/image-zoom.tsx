"use client"

import { useRef, useState, type MouseEvent } from "react"
import { Maximize } from "lucide-react"

interface ImageZoomProps {
  src: string
  alt: string
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
  const [zoomed, setZoomed] = useState(false)
  const [bgPos, setBgPos] = useState("0% 0%")
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setBgPos(`${x}% ${y}%`)
  }

  return (
    <div
      ref={ref}
      className={`relative aspect-square rounded-2xl bg-[var(--bg-secondary)] overflow-hidden cursor-${zoomed ? "zoom-out" : "zoom-in"} group`}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{
          opacity: zoomed ? 0 : 1,
          transition: "opacity 0.2s ease-out",
        }}
      />
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "200%",
          backgroundPosition: bgPos,
          opacity: zoomed ? 1 : 0,
          transition: "opacity 0.2s ease-out",
        }}
      />
      <div className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-axel opacity-0 group-hover:opacity-100 transition-opacity">
        <Maximize className="w-4 h-4 text-[var(--text-primary)]" />
      </div>
    </div>
  )
}
