export type Pricing = "Free" | "Freemium" | "Paid"

export interface User {
  id: number
  name?: string
  email: string
}

export interface Category {
  id: number
  slug: string
  name: string
  icon: string
  description: string
  createdAt: string
  toolCount?: number
}

export interface Tool {
  id: number
  slug: string
  name: string
  description: string
  longDescription?: string
  logoUrl?: string
  websiteUrl: string
  categoryId: number
  category?: Category
  pricing: Pricing
  featured: boolean
  rating: number
  tags: string[]
  launchYear?: number
  keyFeatures: string[]
  pros: string[]
  cons: string[]
  createdAt: string
}

export interface PricingDistributionItem {
  pricing: Pricing
  count: number
}

export interface CategoryDistributionItem {
  name: string
  count: number
}

export interface DashboardStats {
  totalTools: number
  featuredTools: number
  totalCategories: number
  pricingDistribution: PricingDistributionItem[]
  categoryDistribution: CategoryDistributionItem[]
  recentTools: Tool[]
}

export interface PaginatedTools {
  data: Tool[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
}
