'use client'

import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useParts } from '@/hooks/useParts'
import { PartCard } from '@/components/parts/PartCard'
import { PartCardSkeleton } from '@/components/parts/PartCardSkeleton'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { PageContainer } from '@/components/layout/PageContainer'
import { CarFilter } from '@/components/filters/CarFilter'
import { CategoryFilter } from '@/components/filters/CategoryFilter'
import { PriceRangeFilter } from '@/components/filters/PriceRangeFilter'
import { ConditionFilter } from '@/components/filters/ConditionFilter'
import type { PartFilters, PartCondition } from '@/types/part'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Новые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'stock_desc', label: 'По остатку' },
]

export function CatalogPageClient() {
  const [filters, setFilters] = useState<PartFilters>({ sort: 'newest', page: 1, per_page: 20 })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data, isLoading } = useParts(filters)

  const update = (patch: Partial<PartFilters>) =>
    setFilters((f) => ({ ...f, ...patch, page: 1 }))

  const hasActiveFilters =
    filters.category_id || filters.make_id || filters.condition || filters.price_min || filters.price_max

  const FiltersPanel = () => (
    <div className="flex flex-col gap-6">
      <CategoryFilter
        selectedId={filters.category_id}
        onChange={(v) => update({ category_id: v })}
      />
      <div className="border-t border-border" />
      <CarFilter
        makeId={filters.make_id}
        modelId={filters.model_id}
        generationId={filters.generation_id}
        onChange={(field, value) => update({ [field]: value })}
      />
      <div className="border-t border-border" />
      <PriceRangeFilter
        min={filters.price_min}
        max={filters.price_max}
        onChange={(min, max) => update({ price_min: min, price_max: max })}
      />
      <div className="border-t border-border" />
      <ConditionFilter
        value={filters.condition as PartCondition | undefined}
        onChange={(v) => update({ condition: v })}
      />
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({ sort: 'newest', page: 1, per_page: 20 })}
          className="text-danger"
        >
          <X size={14} />
          Сбросить фильтры
        </Button>
      )}
    </div>
  )

  return (
    <PageContainer className="pb-24 md:pb-8">
      <div className="flex gap-6">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-20 bg-bg-surface border border-border rounded-lg p-4">
            <FiltersPanel />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setFiltersOpen(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 bg-bg-surface border border-border rounded-md text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <SlidersHorizontal size={16} />
              Фильтры
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              )}
            </button>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-text-muted hidden sm:block">Сортировка:</span>
              <select
                value={filters.sort ?? 'newest'}
                onChange={(e) => update({ sort: e.target.value as PartFilters['sort'] })}
                className="bg-bg-input border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {data && (
              <span className="text-xs text-text-muted">{data.total} шт</span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <PartCardSkeleton key={i} />)}
            </div>
          ) : data?.items.length === 0 ? (
            <EmptyState
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры"
              action={{ label: 'Сбросить', onClick: () => setFilters({ sort: 'newest', page: 1, per_page: 20 }) }}
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data?.items.map((part) => <PartCard key={part.id} part={part} />)}
            </div>
          )}

          {data && data.pages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                page={data.page}
                pages={data.pages}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </div>
          )}
        </div>
      </div>

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Фильтры">
        <FiltersPanel />
        <Button className="w-full mt-4" onClick={() => setFiltersOpen(false)}>
          Применить
        </Button>
      </BottomSheet>
    </PageContainer>
  )
}
