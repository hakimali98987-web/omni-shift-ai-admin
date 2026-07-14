"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Search, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"
import { api, getApiErrorMessage } from "@/lib/api"
import type { Category, Tool } from "@/lib/types"
import { useDebounce } from "@/hooks/use-debounce"
import { PageHeader } from "@/components/page-header"
import { PricingBadge } from "@/components/pricing-badge"
import { StarRating } from "@/components/star-rating"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 10
const ALL = "all"

export default function ToolsPage() {
  const router = useRouter()
  const [tools, setTools] = useState<Tool[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)
  const [category, setCategory] = useState<string>(ALL)
  const [pricing, setPricing] = useState<string>(ALL)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState<number[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Tool | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [mutating, setMutating] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    api
      .get("/categories")  // ✅ fixed
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
      .catch(() => {})
  }, [])

  const fetchTools = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | boolean> = {
        page,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (category !== ALL) params.category = category
      if (pricing !== ALL) params.pricing = pricing
      if (featuredOnly) params.featured = true

      const res = await api.get("/tools", { params })  // ✅ fixed
      const list: Tool[] = res.data?.data ?? res.data?.tools ?? (Array.isArray(res.data) ? res.data : [])
      setTools(list)
      setTotal(res.data?.total ?? list.length)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load tools"))
      setTools([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, category, pricing, featuredOnly])

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  useEffect(() => {
    setPage(1)
    setSelected([])
  }, [debouncedSearch, category, pricing, featuredOnly])

  const categoryName = useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categories])

  const allSelected = tools.length > 0 && selected.length === tools.length

  function toggleSelectAll() {
    setSelected(allSelected ? [] : tools.map((t) => t.id))
  }

  function toggleSelect(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleToggleFeatured(tool: Tool) {
    setTools((prev) => prev.map((t) => (t.id === tool.id ? { ...t, featured: !t.featured } : t)))
    try {
      await api.patch(`/tools/${tool.id}/toggle-featured`)  // ✅ fixed
    } catch (err) {
      setTools((prev) => prev.map((t) => (t.id === tool.id ? { ...t, featured: tool.featured } : t)))
      toast.error(getApiErrorMessage(err, "Failed to update featured status"))
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setMutating(true)
    try {
      await api.delete(`/tools/${deleteTarget.id}`)  // ✅ fixed
      toast.success(`Deleted "${deleteTarget.name}"`)
      setDeleteTarget(null)
      fetchTools()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete tool"))
    } finally {
      setMutating(false)
    }
  }

  async function handleBulkDelete() {
    setMutating(true)
    try {
      await api.post("/tools/bulk-delete", { ids: selected })  // ✅ fixed
      toast.success(`Deleted ${selected.length} tool${selected.length > 1 ? "s" : ""}`)
      setSelected([])
      setBulkDeleteOpen(false)
      fetchTools()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete tools"))
    } finally {
      setMutating(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Tools" description="Manage the AI tools in your directory.">
        <Button asChild>
          <Link href="/tools/new">
            <Plus className="size-4" />
            Add New Tool
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="search" className="text-xs">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Pricing</Label>
            <Select value={pricing} onValueChange={setPricing}>
              <SelectTrigger className="w-full lg:w-36">
                <SelectValue placeholder="All pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All pricing</SelectItem>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Freemium">Freemium</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pb-2 lg:pb-2.5">
            <Checkbox
              id="featured"
              checked={featuredOnly}
              onCheckedChange={(v) => setFeaturedOnly(v === true)}
            />
            <Label htmlFor="featured" className="text-sm font-normal">
              Featured only
            </Label>
          </div>
        </div>
      </Card>

      {/* Bulk actions */}
      {selected.length > 0 ? (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-accent px-4 py-2.5">
          <span className="text-sm font-medium text-accent-foreground">
            {selected.length} item{selected.length > 1 ? "s" : ""} selected
          </span>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Delete Selected
          </Button>
        </div>
      ) : null}

      {/* Table */}
      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    disabled={tools.length === 0}
                  />
                </TableHead>
                <TableHead className="w-14">Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="size-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="size-10 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-9 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : tools.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8}>
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                        <Wrench className="size-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">No tools found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your filters or add a new tool.
                        </p>
                      </div>
                      <Button asChild size="sm">
                        <Link href="/tools/new">
                          <Plus className="size-4" />
                          Add New Tool
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(tool.id)}
                        onCheckedChange={() => toggleSelect(tool.id)}
                        aria-label={`Select ${tool.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="relative size-10 overflow-hidden rounded-md border bg-muted">
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
                    </TableCell>
                    <TableCell>
                      <Link href={`/tools/${tool.id}/edit`} className="font-medium hover:text-primary hover:underline">
                        {tool.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {tool.category?.name ?? categoryName.get(tool.categoryId) ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <PricingBadge pricing={tool.pricing} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={tool.featured}
                        onCheckedChange={() => handleToggleFeatured(tool)}
                        aria-label="Toggle featured"
                      />
                    </TableCell>
                    <TableCell>
                      <StarRating rating={tool.rating ?? 0} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label={`Edit ${tool.name}`}>
                          <Link href={`/tools/${tool.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(tool)}
                          aria-label={`Delete ${tool.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {!loading && tools.length > 0 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} tool{total !== 1 ? "s" : ""} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete tool?"
        description={`This will permanently delete "${deleteTarget?.name}". This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={mutating}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete selected tools?"
        description={`This will permanently delete ${selected.length} tool${selected.length > 1 ? "s" : ""}. This action cannot be undone.`}
        confirmLabel="Delete All"
        destructive
        loading={mutating}
        onConfirm={handleBulkDelete}
      />
    </div>
  )
}
