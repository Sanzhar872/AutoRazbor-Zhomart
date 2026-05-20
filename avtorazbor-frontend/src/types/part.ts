import type { FavoriteMeta } from './api'
import type { Category } from './category'
import type { CarGeneration } from './car'

export type PartCondition = 'good' | 'fair' | 'poor'
export type PartStatus = 'active' | 'sold_out' | 'draft' | 'archived'

export interface PartImage {
  id: string
  public_url: string
  position: number
  is_primary: boolean
}

export interface Part {
  id: string
  title: string
  slug: string
  description: string | null
  oem_number: string | null
  sku: string | null
  price_kzt: number
  stock: number
  condition: PartCondition
  status: PartStatus
  weight_kg: number | null
  contact_phone: string | null
  category: Category
  images: PartImage[]
  car_generations: CarGeneration[]
  favorite_meta?: FavoriteMeta
  created_at: string
  updated_at: string
}

export interface PartListItem {
  id: string
  title: string
  slug: string
  price_kzt: number
  stock: number
  condition: PartCondition
  status: PartStatus
  category: Category
  images: PartImage[]
  created_at: string
}

export interface PartFilters {
  category_id?: string
  make_id?: string
  model_id?: string
  generation_id?: string
  status?: string
  condition?: string
  price_min?: number
  price_max?: number
  oem?: string
  q?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'stock_desc'
  page?: number
  per_page?: number
}
