export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface ApiError {
  type: string
  title: string
  status: number
  detail: string
  [key: string]: unknown
}

export interface FavoriteMeta {
  max_slots: number
  used_slots: number
  available_slots: number
  is_favorited_by_me: boolean
}

export interface SiteConfig {
  contact_phone: string
  contact_phone_display: string
  working_hours: string
  address: string
  whatsapp_link: string
}
