import { cn } from "@/lib/utils"

interface BadgeProps {
  variant?: "credit" | "promo" | "stock" | "default"
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold",
        variant === "credit" && "bg-[var(--text-link)] text-white",
        variant === "promo" && "gradient-axel text-white",
        variant === "stock" && "bg-green-50 text-green-700",
        variant === "default" && "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
        className
      )}
    >
      {children}
    </span>
  )
}