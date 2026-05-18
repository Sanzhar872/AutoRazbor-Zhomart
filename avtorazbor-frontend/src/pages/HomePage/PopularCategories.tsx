import { Link } from 'react-router-dom'
import { Grid3X3 } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/constants/routes'

export function PopularCategories() {
  const { data: categories, isLoading } = useCategories()

  return (
    <section>
      <h2 className="text-xl font-semibold text-text-primary mb-4">Категории</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          : categories?.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                to={`${ROUTES.CATALOG}?category_id=${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 bg-bg-surface border border-border rounded-lg hover:border-accent/50 hover:bg-accent-muted transition-all text-center group"
              >
                {cat.icon_url ? (
                  <img src={cat.icon_url} alt={cat.name} className="w-8 h-8 object-contain" />
                ) : (
                  <Grid3X3 size={24} className="text-text-muted group-hover:text-accent transition-colors" />
                )}
                <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors font-medium leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  )
}
