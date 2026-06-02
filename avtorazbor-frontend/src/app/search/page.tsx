import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchPageClient } from '@/views/SearchPage'

export const metadata: Metadata = {
  title: 'Поиск запчастей',
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  )
}
