import type { Metadata } from 'next'
import { CategoriesAdminPageClient } from '@/views/admin/CategoriesAdminPage'

export const metadata: Metadata = { title: 'Категории' }

export default function AdminCategoriesPage() {
  return <CategoriesAdminPageClient />
}
