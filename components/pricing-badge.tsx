import { cn } from "@/lib/utils"
import type { Pricing } from "@/lib/types"

const styles: Record<Pricing, string> = {
  Free: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  Freemium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  Paid: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
}

export function PricingBadge({ pricing }: { pricing: Pricing }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[pricing] ?? styles.Free,
      )}
    >
      {pricing}
    </span>
  )
}
