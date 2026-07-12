"use client"

import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]",
            "transition-all duration-300",
            "focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10",
            "hover:border-[var(--border-hover)]/30",
            icon && "pl-12",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export default Input