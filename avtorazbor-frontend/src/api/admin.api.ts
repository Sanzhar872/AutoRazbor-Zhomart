import { client } from './client'

export interface Sale {
  id: string
  part_id: string
  title: string
  slug: string
  qty: number
  price_kzt: number
  total_kzt: number
  comment: string
  status: 'active' | 'returned'
  returned_at: string | null
  created_at: string | null
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

export interface StockChangeResponse {
  part_id: string
  title: string
  stock: number
  status: string
}

export const adminApi = {
  getDashboard: () =>
    client.get<DashboardData>('/admin/dashboard', { params: { tz: new Date().getTimezoneOffset() } }).then((r) => r.data),

  // Stock
  getStock: (q?: string, page = 1) =>
    client.get('/admin/stock', { params: { ...(q ? { q } : {}), page, per_page: 50 } }).then((r) => r.data),

  increaseStock: (partId: string, delta: number, comment?: string) =>
    client.post<StockChangeResponse>(`/admin/stock/${partId}/increase`, { delta, comment }).then((r) => r.data),

  setStock: (partId: string, stock: number, comment?: string) =>
    client.post<StockChangeResponse>(`/admin/stock/${partId}/set`, { stock, comment }).then((r) => r.data),

  // Sales
  getSales: (params?: { status?: string; date_from?: string; date_to?: string; page?: number; per_page?: number }) =>
    client.get('/admin/sales', { params }).then((r) => r.data),

  createSale: (partId: string, qty: number, comment?: string) =>
    client.post<Sale>('/admin/sales', { part_id: partId, qty, comment: comment ?? '' }).then((r) => r.data),

  returnSale: (saleId: string) =>
    client.post<Sale>(`/admin/sales/${saleId}/return`).then((r) => r.data),

  deleteSale: (saleId: string) =>
    client.delete(`/admin/sales/${saleId}`).then((r) => r.data),

  getRevenue: (dateFrom: string, dateTo: string) =>
    client.get('/admin/revenue', { params: { date_from: dateFrom, date_to: dateTo } }).then((r) => r.data),

  resetAll: () =>
    client.delete('/admin/reset').then((r) => r.data),
}
