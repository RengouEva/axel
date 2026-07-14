import { Star } from "lucide-react"

export default function StarRating({ rating, size = "sm", showValue = true, reviews }: {
  rating: number
  size?: "xs" | "sm" | "md"
  showValue?: boolean
  reviews?: number
}) {
  const sizeMap = { xs: "w-3 h-3", sm: "w-3.5 sm:w-4 h-3.5 sm:h-4", md: "w-5 h-5" }
  const starClass = sizeMap[size]

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starClass} ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-[var(--bg-secondary)] text-[var(--border)]"
          }`}
        />
      ))}
      {showValue && (
        <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] ml-0.5">
          {rating}
        </span>
      )}
      {reviews !== undefined && (
        <span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">
          ({reviews})
        </span>
      )}
    </div>
  )
}
