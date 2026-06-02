import type { Metadata } from 'next'
import { StockPageClient } from '@/views/admin/StockPage'

export const metadata: Metadata = { title: 'Склад' }

export default function AdminStockPage() {
  return <StockPageClient />
}
