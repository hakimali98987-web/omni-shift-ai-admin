"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { FolderTree, Gift, Star, Wrench } from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"
import type { DashboardStats } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const statCards = [
  { key: "totalTools", label: "Total Tools", icon: Wrench, accent: "border-l-chart-1", iconClass: "text-chart-1" },
  { key: "featuredTools", label: "Featured", icon: Star, accent: "border-l-amber-500", iconClass: "text-amber-500" },
  {
    key: "totalCategories",
    label: "Categories",
    icon: FolderTree,
    accent: "border-l-chart-3",
    iconClass: "text-chart-3",
  },
  { key: "freeTools", label: "Free Tools", icon: Gift, accent: "border-l-emerald-500", iconClass: "text-emerald-500" },
] as const

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .get<DashboardStats>("/stats")
      .then((res) => {
        if (active) setStats(res.data)
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err, "Failed to load dashboard stats"))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const freeCount = stats?.pricingDistribution?.find((p) => p.pricing === "Free")?.count ?? 0
  const values: Record<string, number> = {
    totalTools: stats?.totalTools ?? 0,
    featuredTools: stats?.featuredTools ?? 0,
    totalCategories: stats?.totalCategories ?? 0,
    freeTools: freeCount,
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Dashboard" description="Overview of your AI tools directory." />

      {error ? (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.key} className={cn("border-l-4", card.accent)}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  {loading ? (
                    <Skeleton className="mt-2 h-8 w-16" />
                  ) : (
                    <p className="mt-1 text-3xl font-semibold tabular-nums">{values[card.key]}</p>
                  )}
                </div>
                <div className={cn("flex size-11 items-center justify-center rounded-lg bg-muted", card.iconClass)}>
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Tools by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <CategoryChart data={stats?.categoryDistribution ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recently Added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="size-10 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : stats?.recentTools?.length ? (
              stats.recentTools.slice(0, 5).map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}/edit`}
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {tool.logoUrl ? (
                      <Image
                        src={tool.logoUrl || "/placeholder.svg"}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium text-muted-foreground">
                        {tool.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tool.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tool.category?.name ?? "Uncategorized"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {tool.createdAt ? new Date(tool.createdAt).toLocaleDateString() : ""}
                  </span>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No tools yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
