import type { Metadata } from 'next'
import { DashboardPageClient } from '@/views/admin/DashboardPage'

export const metadata: Metadata = { title: 'Дашборд' }

export default function AdminPage() {
  return <DashboardPageClient />
}
