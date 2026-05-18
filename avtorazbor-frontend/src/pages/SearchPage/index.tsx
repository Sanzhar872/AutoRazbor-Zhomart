import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useParts } from '@/hooks/useParts'
import { PartCard } from '@/components/parts/PartCard'
import { PartCardSkeleton } from '@/components/parts/PartCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { SearchBar } from '@/components/search/SearchBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Search } from 'lucide-react'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const page = Number(searchParams.get('page') ?? 1)

  const { data, isLoading } = useParts({ q, page, per_page: 20, status: undefined })

  return (
    <>
      <Helmet>
        <title>{q ? `${q} — Поиск` : 'Поиск'} | АвтоРазбор</title>
      </Helmet>
      <PageContainer className="pb-24 md:pb-8">
        <div className="max-w-xl mb-6">
          <SearchBar autoFocus />
        </div>

        {q && (
          <p className="text-sm text-text-muted mb-4">
            {isLoading ? 'Ищем...' : `Найдено: ${data?.total ?? 0} результатов по запросу «${q}»`}
          </p>
        )}

        {!q ? (
          <EmptyState
            icon={<Search size={48} />}
            title="Введите запрос"
            description="Найдём запчасть по названию или OEM номеру"
          />
        ) : isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PartCardSkeleton key={i} />)}
          </div>
        ) : data?.items.length === 0 ? (
          <EmptyState
            title="Ничего не найдено"
            description={`По запросу «${q}» ничего не нашлось`}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.items.map((part) => <PartCard key={part.id} part={part} />)}
            </div>
            {data && data.pages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination
                  page={data.page}
                  pages={data.pages}
                  onPageChange={(p) => {
                    setSearchParams({ q, page: String(p) })
                    window.scrollTo(0, 0)
                  }}
                />
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  )
}
