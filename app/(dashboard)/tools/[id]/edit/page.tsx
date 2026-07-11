"use client"

import { use } from "react"
import { ToolForm } from "@/components/tool-form"

export default function EditToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <ToolForm toolId={Number(id)} />
}
