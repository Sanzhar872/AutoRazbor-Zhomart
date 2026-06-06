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
  id: string
  part_id: string
  title: string
  slug: string
  price_kzt: number
  profit: number
  delta: number
  is_return: boolean
  stock_before: number | null
  stock_after: number | null
  comment: string
  sold_at: string | null
  deleted_at: string | null
}

export interface DashboardData {
  total_parts: number
  active_parts: number
  low_stock_parts: number
  added_today: number
  sold_today: number
  sold_total: number
  recent_sales: SaleRecord[]
  deleted_sales: SaleRecord[]
  top_favorites: Array<{ id: string; title: string; favorites: number }>
  revenue: { today: number; week: number; month: number }
}

export const adminApi = {
  getDashboard: () =>
    client.get<DashboardData>('/admin/dashboard', { params: { tz: new Date().getTimezoneOffset() } }).then((r) => r.data),

  getStock: (q?: string, page = 1) =>
    client.get('/admin/stock', { params: { ...(q ? { q } : {}), page, per_page: 50 } }).then((r) => r.data),

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

  returnStock: (partId: string, delta: number, comment?: string) =>
    client
      .post<StockChangeResponse>(`/admin/stock/${partId}/return`, { delta, comment })
      .then((r) => r.data),

  deleteSale: (auditId: string) =>
    client.delete(`/admin/sales/${auditId}`).then((r) => r.data),

  restoreSale: (auditId: string) =>
    client.post(`/admin/sales/${auditId}/restore`).then((r) => r.data),

  permanentDeleteSale: (auditId: string) =>
    client.delete(`/admin/sales/${auditId}/permanent`).then((r) => r.data),

  getRevenue: (dateFrom: string, dateTo: string) =>
    client.get('/admin/revenue', { params: { date_from: dateFrom, date_to: dateTo } }).then((r) => r.data),
}
