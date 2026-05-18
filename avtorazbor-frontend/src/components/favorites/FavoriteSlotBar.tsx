import { cn } from '@/lib/cn'
import type { FavoriteMeta } from '@/types/api'

interface FavoriteSlotBarProps {
  meta: FavoriteMeta
  className?: string
}

export function FavoriteSlotBar({ meta, className }: FavoriteSlotBarProps) {
  const { max_slots, used_slots, available_slots } = meta

  if (max_slots === 0) return null

  const slots = Array.from({ length: max_slots }, (_, i) => i < used_slots)

  let label: string | null = null
  if (available_slots === 0) label = 'Все места заняты'
  else if (available_slots === 1) label = '1 место осталось'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {slots.map((filled, i) => (
          <span
            key={i}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              filled ? 'bg-accent' : 'bg-border'
            )}
          />
        ))}
      </div>
      {label && <span className="text-xs text-text-secondary">{label}</span>}
    </div>
  )
}
