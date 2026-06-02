import type { Metadata } from 'next'
import { CarsAdminPageClient } from '@/views/admin/CarsAdminPage'

export const metadata: Metadata = { title: 'Автомобили' }

export default function AdminCarsPage() {
  return <CarsAdminPageClient />
}
