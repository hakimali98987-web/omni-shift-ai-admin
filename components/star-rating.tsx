import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function StarRating({ rating, className }: { rating: number; className?: string }) {
  const rounded = Math.round(rating * 2) / 2
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rounded >= star
        const half = !filled && rounded >= star - 0.5
        return (
          <span key={star} className="relative">
            <Star className="size-4 text-muted-foreground/40" />
            {(filled || half) && (
              <Star
                className={cn(
                  "absolute inset-0 size-4 fill-amber-400 text-amber-400",
                  half && "[clip-path:inset(0_50%_0_0)]",
                )}
              />
            )}
          </span>
        )
      })}
      <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  )
}
