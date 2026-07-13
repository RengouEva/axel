"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const scale = size === "sm" ? 0.6 : size === "lg" ? 1.4 : 1

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: 56 * scale, height: 56 * scale }}
      >
        <img
          src="/images/logo-axel.png"
          alt="AXEL"
          className="select-none pointer-events-none"
          style={{ height: 20 * scale, width: "auto" }}
        />
        <div
          className="absolute inset-0 animate-[axel-spin_1.6s_linear_infinite]"
          style={{ animationDuration: `${1.6 / scale}s` }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-0 rounded-full bg-[#1769F2]"
              style={{
                width: 7 * scale,
                height: 7 * scale,
                marginLeft: -3.5 * scale,
                marginTop: -3.5 * scale,
                opacity: i === 0 ? 1 : 0.2 + (i / 8) * 0.8,
                transform: `rotate(${45 * i}deg) translateY(${24 * scale}px)`,
              }}
            />
          ))}
        </div>
      </div>
      {text && <p className="text-sm text-[var(--text-muted)] animate-pulse">{text}</p>}
      <style>{`@keyframes axel-spin{to{transform:rotate(360deg)}}`}</style>
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
