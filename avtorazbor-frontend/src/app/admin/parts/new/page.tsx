import type { Metadata } from 'next'
import { PartFormPageClient } from '@/views/admin/PartFormPage'

export const metadata: Metadata = { title: 'Новая запчасть' }

export default function AdminPartNewPage() {
  return <PartFormPageClient />
}
