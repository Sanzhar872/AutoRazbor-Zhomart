import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogPageClient } from '@/views/CatalogPage'

export const metadata: Metadata = {
  title: 'Каталог запчастей',
  description: 'Каталог б/у автозапчастей. Фильтр по марке, категории и цене.',
}

export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogPageClient />
    </Suspense>
  )
}
