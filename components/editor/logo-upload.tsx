"use client"

import Image from "next/image"
import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react"
import { toast } from "sonner"
import { api, getApiErrorMessage } from "@/lib/api"
import type { UploadResponse } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function LogoUpload({
  value,
  onChange,
}: {
  value?: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      setUploading(true)
      setProgress(0)
      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await api.post<UploadResponse>("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
          },
        })
        onChange(res.data.url)
        toast.success("Logo uploaded")
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Upload failed"))
      } finally {
        setUploading(false)
      }
    },
    [onChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: uploading,
  })

  async function handleRemove() {
    const url = value
    onChange("")
    if (url) {
      try {
        await api.delete("/upload", { data: { url } })
      } catch {
        // Non-blocking: the reference is already cleared in the form.
      }
    }
  }

  if (value) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative size-20 overflow-hidden rounded-lg border bg-muted">
          <Image src={value || "/placeholder.svg"} alt="Logo preview" fill sizes="80px" className="object-cover" unoptimized />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Current logo</p>
          <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
            <X className="size-4" />
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        isDragActive ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-muted/50",
        uploading && "pointer-events-none opacity-70",
      )}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <>
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <>
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            {isDragActive ? (
              <UploadCloud className="size-5 text-primary" />
            ) : (
              <ImageIcon className="size-5 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm font-medium">Drag & drop a logo, or click to browse</p>
          <p className="text-xs text-muted-foreground">PNG, JPG or SVG</p>
        </>
      )}
    </div>
  )
}
