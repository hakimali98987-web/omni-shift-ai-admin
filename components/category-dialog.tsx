"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api, getApiErrorMessage } from "@/lib/api"
import type { Category } from "@/lib/types"
import { slugify } from "@/lib/slug"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const EMOJI_SUGGESTIONS = ["🤖", "✍️", "🎨", "🎬", "🎵", "💻", "📊", "🔍", "📈", "🧠", "💬", "⚡"]

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSaved: () => void
}) {
  const isEdit = !!category
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [icon, setIcon] = useState("")
  const [description, setDescription] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
      setSlug(category?.slug ?? "")
      setIcon(category?.icon ?? "")
      setDescription(category?.description ?? "")
      setSlugEdited(!!category)
    }
  }, [open, category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !icon.trim() || !description.trim()) {
      toast.error("Name, icon and description are required")
      return
    }
    setSaving(true)
    const payload = { name, slug: slug || slugify(name), icon, description }
    try {
      if (isEdit) {
        await api.put(`/categories/${category!.id}`, payload)
        toast.success("Category updated")
      } else {
        await api.post("/categories", payload)
        toast.success("Category created")
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save category"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this category's details." : "Create a new category for organizing tools."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={name}
              placeholder="e.g., Writing Assistants"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (!slugEdited && name) setSlug(slugify(name))
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={slug}
              placeholder="writing-assistants"
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugEdited(true)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-icon">Icon</Label>
            <Input
              id="cat-icon"
              value={icon}
              placeholder="Emoji, e.g. 🤖"
              onChange={(e) => setIcon(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {EMOJI_SUGGESTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className="flex size-8 items-center justify-center rounded-md border text-base hover:bg-muted"
                  aria-label={`Use ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              value={description}
              rows={3}
              placeholder="What kinds of tools belong here?"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
