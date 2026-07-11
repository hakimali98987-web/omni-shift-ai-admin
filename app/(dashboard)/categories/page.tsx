"use client"

import { useCallback, useEffect, useState } from "react"
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { api, getApiErrorMessage } from "@/lib/api"
import type { Category } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { CategoryDialog } from "@/components/category-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/api/admin/categories")
      setCategories(Array.isArray(res.data) ? res.data : (res.data?.data ?? []))
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to load categories"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setDialogOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/categories/${deleteTarget.id}`)
      toast.success(`Deleted "${deleteTarget.name}"`)
      setDeleteTarget(null)
      fetchCategories()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Cannot delete a category that still has tools"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Categories" description="Organize your tools into categories.">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </PageHeader>

      <Card className="overflow-hidden py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Tools</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="size-8 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-8 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : categories.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                        <FolderTree className="size-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">No categories yet</p>
                        <p className="text-sm text-muted-foreground">Create your first category to get started.</p>
                      </div>
                      <Button size="sm" onClick={openCreate}>
                        <Plus className="size-4" />
                        Add Category
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex size-9 items-center justify-center rounded-md border bg-muted text-lg">
                        {category.icon}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{category.slug}</code>
                    </TableCell>
                    <TableCell className="hidden max-w-xs md:table-cell">
                      <p className="truncate text-sm text-muted-foreground">{category.description}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {category.toolCount ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(category)}
                          aria-label={`Edit ${category.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(category)}
                          aria-label={`Delete ${category.name}`}
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

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        onSaved={fetchCategories}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category?"
        description={`This will permanently delete "${deleteTarget?.name}". Categories that still contain tools cannot be deleted.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
