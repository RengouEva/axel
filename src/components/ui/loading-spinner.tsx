"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-10 h-10 border-[3px]",
    lg: "w-14 h-14 border-4",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "rounded-full border-[var(--border)] border-t-[#1769F2] animate-spin",
          sizeClasses[size],
        )}
      />
      {text && <p className="text-sm text-[var(--text-muted)]">{text}</p>}
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
