"use client"

import { forwardRef, type ButtonHTMLAttributes } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, children, ...props }, ref) => {
    const Comp = motion.button as any

    return (
      <Comp
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl font-semibold transition-colors duration-300",
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
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export default Button
