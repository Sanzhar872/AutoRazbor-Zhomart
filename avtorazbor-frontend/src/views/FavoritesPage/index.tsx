'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFavorites } from '@/hooks/useFavorites'
import { PartCard } from '@/components/parts/PartCard'
import { PartCardSkeleton } from '@/components/parts/PartCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants/routes'

export function FavoritesPageClient() {
  const { data: favorites, isLoading } = useFavorites()
  const router = useRouter()

  return (
    <PageContainer className="pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Избранное</h1>
        {favorites && favorites.length > 0 && (
          <span className="text-sm text-text-muted">{favorites.length} запчасти</span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <PartCardSkeleton key={i} />)}
        </div>
      ) : !favorites?.length ? (
        <EmptyState
          icon={<Heart size={48} />}
          title="Нет избранных запчастей"
          description="Добавляйте запчасти, чтобы не потерять нужное"
          action={{ label: 'Перейти в каталог', onClick: () => router.push(ROUTES.CATALOG) }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((fav) => (
            <PartCard key={fav.id} part={fav.part} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
