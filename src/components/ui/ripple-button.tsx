"use client"

import { useState, useRef, type MouseEvent, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

interface RippleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

export default function RippleButton({
  className, variant = "primary", size = "md", fullWidth, children, onClick, ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const ref = useRef<HTMLButtonElement>(null)
  const idRef = useRef(0)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const id = ++idRef.current
    setRipples(prev => [...prev, { id, x, y, size }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600)
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769F2] focus-visible:ring-offset-2",
        fullWidth && "w-full",
        variant === "primary" && "gradient-axel text-white shadow-lg hover:shadow-xl hover:gradient-axel-hover",
        variant === "secondary" && "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-axel hover:shadow-axel-lg",
        variant === "outline" && "border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:text-[var(--text-link)]",
        variant === "ghost" && "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]",
        size === "sm" && "px-4 py-2 text-sm gap-1.5",
        size === "md" && "px-6 py-3 text-base gap-2",
        size === "lg" && "px-8 py-4 text-lg gap-2.5",
        className
      )}
      {...props}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      {children}
    </button>
  )
}
