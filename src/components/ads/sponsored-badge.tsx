import { cn } from "@/lib/utils"

export default function SponsoredBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20", className)}>
      Sponsorisé
    </span>
  )
}
