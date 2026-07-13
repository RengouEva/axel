"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const scale = size === "sm" ? 0.6 : size === "lg" ? 1.4 : 1
  const orbit = 26 * scale
  const dot = 6 * scale
  const half = dot / 2

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: 64 * scale, height: 64 * scale }}
      >
        <img
          src="/images/logo-axel.png"
          alt="AXEL"
          className="select-none pointer-events-none z-10"
          style={{ height: 24 * scale, width: "auto" }}
        />
        <div
          className="absolute inset-0 animate-[axel-orbit_2s_linear_infinite]"
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (360 / 8) * i
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full bg-[#1769F2]"
                style={{
                  width: dot,
                  height: dot,
                  marginLeft: -half,
                  marginTop: -half,
                  opacity: i === 0 ? 1 : 0.2 + (i / 8) * 0.6,
                  transform: `rotate(${angle}deg) translateX(${orbit}px)`,
                }}
              />
            )
          })}
        </div>
      </div>
      {text && <p className="text-sm text-[var(--text-muted)] animate-pulse">{text}</p>}
      <style>{`@keyframes axel-orbit{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function FullPageLoader({ text = "Chargement..." }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}
