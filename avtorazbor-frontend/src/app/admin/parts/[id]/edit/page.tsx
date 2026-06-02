import type { Metadata } from 'next'
import { PartFormPageClient } from '@/views/admin/PartFormPage'

export const metadata: Metadata = { title: 'Редактировать запчасть' }

export default function AdminPartEditPage({ params }: { params: { id: string } }) {
  return <PartFormPageClient id={params.id} />
}
