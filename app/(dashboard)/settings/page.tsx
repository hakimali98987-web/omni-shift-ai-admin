"use client"

import { useState } from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export default function SettingsPage() {
  const { user } = useAuth()
  const [siteName, setSiteName] = useState("Omni Shift AI")
  const [metaDescription, setMetaDescription] = useState(
    "Discover the best AI tools, curated and organized for you.",
  )

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    toast.success("Settings saved")
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your directory configuration." />

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Basic information about your directory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Name</Label>
              <Input id="site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                rows={3}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input id="admin-email" value={user?.email ?? ""} readOnly disabled />
              <p className="text-xs text-muted-foreground">This is the email associated with your account.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="size-4 text-muted-foreground" />
              Advanced Settings
            </CardTitle>
            <CardDescription>API keys, integrations, and webhooks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center rounded-lg bg-muted/50 py-8 text-sm text-muted-foreground">
              Coming soon
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  )
}
