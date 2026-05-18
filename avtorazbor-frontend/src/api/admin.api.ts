import { client } from './client'

export interface StockChangeResponse {
  part_id: string
  title: string
  stock_before: number
  stock_after: number
  max_favorites_before: number
  max_favorites_after: number
  changed_at: string
}

export interface SaleRecord {
  part_id: string
  title: string
  slug: string
  delta: number
  stock_before: number | null
  stock_after: number | null
  comment: string
  sold_at: string | null
}

export interface DashboardData {
  total_parts: number
  active_parts: number
  low_stock_parts: number
  added_today: number
  sold_today: number
  sold_total: number
  recent_sales: SaleRecord[]
  top_favorites: Array<{ id: string; title: string; favorites: number }>
}

export const adminApi = {
  getDashboard: () =>
    client.get<DashboardData>('/admin/dashboard').then((r) => r.data),

  getStock: () =>
    client.get('/admin/stock').then((r) => r.data),

  increaseStock: (partId: string, delta: number, comment?: string) =>
    client
      .post<StockChangeResponse>(`/admin/stock/${partId}/increase`, { delta, comment })
      .then((r) => r.data),

  decreaseStock: (partId: string, delta: number, comment?: string) =>
    client
      .post<StockChangeResponse>(`/admin/stock/${partId}/decrease`, { delta, comment })
      .then((r) => r.data),

  setStock: (partId: string, stock: number, comment?: string) =>
    client
      .post<StockChangeResponse>(`/admin/stock/${partId}/set`, { stock, comment })
      .then((r) => r.data),
}
