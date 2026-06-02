import type { Metadata } from 'next'
import { PartsListPageClient } from '@/views/admin/PartsListPage'

export const metadata: Metadata = { title: 'Запчасти' }

export default function AdminPartsPage() {
  return <PartsListPageClient />
}
