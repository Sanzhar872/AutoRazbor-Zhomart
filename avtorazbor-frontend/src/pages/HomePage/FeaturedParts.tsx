import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useParts } from '@/hooks/useParts'
import { PartCard } from '@/components/parts/PartCard'
import { PartCardSkeleton } from '@/components/parts/PartCardSkeleton'
import { ROUTES } from '@/constants/routes'

export function FeaturedParts() {
  const { data, isLoading } = useParts({ sort: 'newest', per_page: 8 })

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-primary">Новые поступления</h2>
        <Link
          to={ROUTES.CATALOG}
          className="flex items-center gap-1 text-sm text-accent hover:text-accent-hover transition-colors font-medium"
        >
          Все запчасти
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-48 snap-start">
                <PartCardSkeleton />
              </div>
            ))
          : data?.items.map((part) => (
              <div key={part.id} className="flex-shrink-0 w-48 snap-start">
                <PartCard part={part} />
              </div>
            ))}
      </div>

      {/* Desktop: grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <PartCardSkeleton key={i} />)
          : data?.items.map((part) => <PartCard key={part.id} part={part} />)}
      </div>
    </section>
  )
}
