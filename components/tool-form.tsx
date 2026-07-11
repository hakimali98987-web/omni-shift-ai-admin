"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { api, getApiErrorMessage } from "@/lib/api"
import type { Category, Tool } from "@/lib/types"
import { slugify } from "@/lib/slug"
import { PageHeader } from "@/components/page-header"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { LogoUpload } from "@/components/editor/logo-upload"
import { ArrayInput } from "@/components/editor/array-input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  longDescription: z.string().optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().min(1, "Website URL is required").url("Must be a valid URL"),
  categoryId: z.coerce.number({ message: "Category is required" }).int().positive("Category is required"),
  pricing: z.enum(["Free", "Freemium", "Paid"]),
  featured: z.boolean(),
  rating: z.coerce.number().min(0, "Min 0").max(5, "Max 5"),
  launchYear: z.coerce.number().int().min(1970).max(2100).optional().or(z.literal(undefined)),
  tags: z.array(z.string()),
  keyFeatures: z.array(z.string()),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
})

type FormValues = z.input<typeof schema>

const defaults: FormValues = {
  name: "",
  slug: "",
  description: "",
  longDescription: "",
  logoUrl: "",
  websiteUrl: "",
  categoryId: undefined as unknown as number,
  pricing: "Free",
  featured: false,
  rating: 0,
  launchYear: undefined,
  tags: [],
  keyFeatures: [],
  pros: [],
  cons: [],
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function ToolForm({ toolId }: { toolId?: number }) {
  const router = useRouter()
  const isEdit = typeof toolId === "number"
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [slugEdited, setSlugEdited] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  useEffect(() => {
    api
      .get("/api/admin/categories")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    let active = true
    setLoading(true)
    api
      .get<Tool>(`/api/admin/tools/${toolId}`)
      .then((res) => {
        if (!active) return
        const t = res.data
        setSlugEdited(true)
        reset({
          name: t.name ?? "",
          slug: t.slug ?? "",
          description: t.description ?? "",
          longDescription: t.longDescription ?? "",
          logoUrl: t.logoUrl ?? "",
          websiteUrl: t.websiteUrl ?? "",
          categoryId: t.categoryId,
          pricing: t.pricing ?? "Free",
          featured: t.featured ?? false,
          rating: t.rating ?? 0,
          launchYear: t.launchYear,
          tags: t.tags ?? [],
          keyFeatures: t.keyFeatures ?? [],
          pros: t.pros ?? [],
          cons: t.cons ?? [],
        })
      })
      .catch((err) => {
        toast.error(getApiErrorMessage(err, "Failed to load tool"))
        router.push("/tools")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [isEdit, toolId, reset, router])

  const nameValue = watch("name")

  function handleNameBlur() {
    if (!slugEdited && nameValue) {
      setValue("slug", slugify(nameValue), { shouldValidate: true })
    }
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      slug: values.slug || slugify(values.name),
      longDescription: values.longDescription || "",
    }
    try {
      if (isEdit) {
        await api.put(`/api/admin/tools/${toolId}`, payload)
        toast.success("Tool updated")
      } else {
        await api.post("/api/admin/tools", payload)
        toast.success("Tool created")
      }
      router.push("/tools")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save tool"))
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-2">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/tools">
            <ArrowLeft className="size-4" />
            Back to Tools
          </Link>
        </Button>
      </div>
      <PageHeader
        title={isEdit ? "Edit Tool" : "New Tool"}
        description={isEdit ? "Update the details for this tool." : "Add a new AI tool to your directory."}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g., ChatGPT" {...register("name")} onBlur={handleNameBlur} />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="e.g., chatgpt"
                {...register("slug", { onChange: () => setSlugEdited(true) })}
              />
              <FieldError message={errors.slug?.message} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="A short summary of the tool"
                {...register("description")}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Long Description</Label>
              <Controller
                control={control}
                name="longDescription"
                render={({ field }) => (
                  <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media & Links</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Logo</Label>
              <Controller
                control={control}
                name="logoUrl"
                render={({ field }) => <LogoUpload value={field.value} onChange={field.onChange} />}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input id="websiteUrl" placeholder="https://..." {...register("websiteUrl")} />
              <FieldError message={errors.websiteUrl?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="launchYear">Launch Year</Label>
              <Input
                id="launchYear"
                type="number"
                placeholder="2023"
                {...register("launchYear")}
              />
              <FieldError message={errors.launchYear?.message} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Classification</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.categoryId?.message} />
            </div>

            <div className="space-y-2">
              <Label>Pricing</Label>
              <Controller
                control={control}
                name="pricing"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select pricing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Freemium">Freemium</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.pricing?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0–5)</Label>
              <Input id="rating" type="number" step="0.1" min="0" max="5" {...register("rating")} />
              <FieldError message={errors.rating?.message} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="featured">Featured</Label>
                <p className="text-xs text-muted-foreground">Highlight this tool</p>
              </div>
              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <Switch id="featured" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tags</Label>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <ArrayInput value={field.value} onChange={field.onChange} placeholder="Add a tag" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Key Features</Label>
              <Controller
                control={control}
                name="keyFeatures"
                render={({ field }) => (
                  <ArrayInput value={field.value} onChange={field.onChange} placeholder="Add a feature" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Pros</Label>
              <Controller
                control={control}
                name="pros"
                render={({ field }) => (
                  <ArrayInput value={field.value} onChange={field.onChange} placeholder="Add a pro" />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Cons</Label>
              <Controller
                control={control}
                name="cons"
                render={({ field }) => (
                  <ArrayInput value={field.value} onChange={field.onChange} placeholder="Add a con" />
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/tools")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              "Update Tool"
            ) : (
              "Create Tool"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
