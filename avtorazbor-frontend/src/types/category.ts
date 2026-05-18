export interface Category {
  id: string
  name: string
  slug: string
  icon_url: string | null
  sort_order: number
  parent_id: string | null
  children: Category[]
}
