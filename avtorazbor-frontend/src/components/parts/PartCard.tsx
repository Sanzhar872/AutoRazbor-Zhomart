'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/formatPrice'
import { resolveUrl } from '@/lib/resolveUrl'
import { cn } from '@/lib/cn'
import { PartConditionBadge } from './PartConditionBadge'
import type { PartListItem } from '@/types/part'

interface PartCardProps {
  part: PartListItem
}

export function PartCard({ part }: PartCardProps) {
  const primaryImage = part.images.find((i) => i.is_primary) ?? part.images[0]
  const dashIdx = part.title.lastIndexOf(' - ')
  const carName = dashIdx !== -1 ? part.title.slice(dashIdx + 3) : null

  return (
    <Link
      href={ROUTES.PART(part.slug)}
      className="group flex flex-col bg-bg-surface border border-border rounded-lg overflow-hidden hover:-translate-y-0.5 hover:shadow-card hover:border-border-focus/50 transition-all duration-150"
    >
      <div className="relative aspect-[4/3] bg-bg-elevated overflow-hidden">
        {primaryImage ? (
          <img
            src={resolveUrl(primaryImage.public_url)}
            alt={part.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3 text-center">
            {carName
              ? <span className="text-xs font-medium text-text-secondary leading-snug">{carName}</span>
              : <span className="text-xs text-text-muted">Нет фото</span>
            }
          </div>
        )}
        {part.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-xs font-medium text-white bg-black/60 px-2 py-1 rounded">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-3 flex-1">
        <p className="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
          {part.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <PartConditionBadge condition={part.condition} />
          {part.stock > 0 && (
            <span className="text-xs text-text-muted">{part.stock} шт</span>
          )}
        </div>
        <p className="text-base font-bold text-text-primary mt-auto">
          {formatPrice(part.price_kzt)}
        </p>
      </div>
    </Link>
  )
}
