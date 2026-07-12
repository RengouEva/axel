import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[var(--border)]/60",
        className
      )}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border-2 border-[var(--border)] overflow-hidden">
      <Skeleton className="aspect-square rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="min-h-[90vh] gradient-axel flex items-center">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-16 w-full bg-white/10" />
            <Skeleton className="h-16 w-3/4 bg-white/10" />
            <Skeleton className="h-6 w-96 bg-white/10" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-44 bg-white/10" />
              <Skeleton className="h-12 w-44 bg-white/10" />
            </div>
          </div>
          <Skeleton className="aspect-square rounded-3xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}

export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-[var(--border)]">
      <Skeleton className="w-14 h-14 rounded-2xl" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
