import type { Metadata } from 'next'
import { FavoritesPageClient } from '@/views/FavoritesPage'

export const metadata: Metadata = { title: 'Избранное' }

export default function FavoritesPage() {
  return <FavoritesPageClient />
}
