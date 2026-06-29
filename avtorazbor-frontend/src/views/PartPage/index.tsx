'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Phone, MessageCircle, Pencil, Package } from 'lucide-react'
import { usePart } from '@/hooks/useParts'
import { resolveUrl } from '@/lib/resolveUrl'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { PageContainer } from '@/components/layout/PageContainer'
import { PartConditionBadge } from '@/components/parts/PartConditionBadge'
import { FavoriteButton } from '@/components/favorites/FavoriteButton'
import { FavoriteSlotBar } from '@/components/favorites/FavoriteSlotBar'
import { formatPrice } from '@/lib/formatPrice'
import { ROUTES } from '@/constants/routes'
import { useConfig } from '@/hooks/useConfig'
import { useAuthStore } from '@/store/auth.store'

const WA_TEXT = encodeURIComponent('Привет! Пишу с сайта, меня интересует…')

function buildWaLink(phone: string) {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits
  return `https://wa.me/${normalized}?text=${WA_TEXT}`
}

interface Props {
  slug: string
}

export function PartPageClient({ slug }: Props) {
  const { data: part, isLoading, error } = usePart(slug)
  const { data: config } = useConfig()
  const [activeIdx, setActiveIdx] = useState(0)
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'admin'

  const sortedImages = part
    ? [...part.images].sort((a, b) => {
        if (a.is_primary) return -1
        if (b.is_primary) return 1
        return a.position - b.position
      })
    : []

  const activeImage = sortedImages[activeIdx] ?? null

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </PageContainer>
    )
  }

  if (error || !part) {
    return (
      <PageContainer className="text-center py-16">
        <p className="text-text-secondary">Запчасть не найдена</p>
        <Link href={ROUTES.CATALOG} className="text-accent text-sm mt-2 inline-block hover:underline">
          Вернуться в каталог
        </Link>
      </PageContainer>
    )
  }

  return (
    <>
      <PageContainer className="pb-32 md:pb-8">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <nav className="flex items-center gap-1.5 text-xs text-text-muted flex-wrap">
            <Link href={ROUTES.CATALOG} className="hover:text-text-secondary">Каталог</Link>
            <ChevronRight size={12} />
            <Link href={`${ROUTES.CATALOG}?category_id=${part.category.id}`} className="hover:text-text-secondary">
              {part.category.name}
            </Link>
            <ChevronRight size={12} />
            <span className="text-text-secondary truncate max-w-[200px]">{part.title}</span>
          </nav>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href={ROUTES.ADMIN_PART_EDIT(slug)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md text-text-secondary hover:bg-bg-elevated transition-colors"
              >
                <Pencil size={13} />
                Редактировать
              </Link>
              <Link
                href={`${ROUTES.ADMIN_STOCK}?q=${encodeURIComponent(part.title)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-accent/40 rounded-md text-accent hover:bg-accent/10 transition-colors"
              >
                <Package size={13} />
                На склад
              </Link>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="aspect-square bg-bg-surface border border-border rounded-lg overflow-hidden">
              {activeImage ? (
                <img
                  key={activeImage.id}
                  src={resolveUrl(activeImage.public_url)}
                  alt={part.title}
                  className="w-full h-full object-contain transition-opacity duration-150"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">
                  Нет фотографии
                </div>
              )}
            </div>

            {sortedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveIdx(idx)}
                    className={`flex-shrink-0 w-16 h-16 bg-bg-surface rounded-md overflow-hidden transition-all ${
                      idx === activeIdx
                        ? 'ring-2 ring-accent border-2 border-accent'
                        : 'border border-border hover:border-accent/60'
                    }`}
                  >
                    <img
                      src={resolveUrl(img.public_url)}
                      alt={`Фото ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-xl md:text-2xl font-semibold text-text-primary leading-snug">
              {part.title}
            </h1>

            <div className="flex items-center gap-2 flex-wrap">
              <PartConditionBadge condition={part.condition} />
              {part.status === 'sold_out' && <Badge variant="danger">Нет в наличии</Badge>}
              {part.stock > 0 && (
                <Badge variant="neutral">{part.stock} шт в наличии</Badge>
              )}
            </div>

            <p className="text-2xl md:text-3xl font-bold text-text-primary">
              {formatPrice(part.price_kzt)}
            </p>

            {(part.oem_number || part.sku) && (
              <div className="flex flex-col gap-1">
                {part.oem_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted w-16 flex-shrink-0">OEM:</span>
                    <code className="font-mono text-text-secondary bg-bg-elevated px-2 py-0.5 rounded text-xs">
                      {part.oem_number}
                    </code>
                  </div>
                )}
                {part.sku && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted w-16 flex-shrink-0">Артикул:</span>
                    <code className="font-mono text-text-secondary bg-bg-elevated px-2 py-0.5 rounded text-xs">
                      {part.sku}
                    </code>
                  </div>
                )}
              </div>
            )}

            {part.car_generations.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-text-muted">Подходит для:</span>
                <div className="flex flex-wrap gap-1.5">
                  {part.car_generations.map((g) => (
                    <Badge key={g.id} variant="neutral">
                      {g.make_name} {g.model_name} {g.name}
                      {g.year_from ? ` ${g.year_from}–${g.year_to ?? '...'}` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border" />

            {part.favorite_meta && (
              <div className="flex flex-col gap-2">
                <FavoriteSlotBar meta={part.favorite_meta} />
                <FavoriteButton
                  partId={part.id}
                  partSlug={part.slug}
                  meta={part.favorite_meta}
                />
              </div>
            )}

            {config && (
              <div className="hidden md:flex flex-col gap-2 bg-bg-surface border border-border rounded-lg p-4">
                <p className="text-sm text-text-secondary">Для покупки позвоните:</p>
                <a
                  href={`tel:${part.contact_phone ?? config.contact_phone}`}
                  className="flex items-center gap-2 text-xl font-bold text-text-primary hover:text-accent transition-colors"
                >
                  <Phone size={20} className="text-accent" />
                  {part.contact_phone ?? config.contact_phone_display}
                </a>
                <p className="text-xs text-text-muted">{config.working_hours}</p>
                <a
                  href={buildWaLink(part.contact_phone ?? config.contact_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-success hover:underline"
                >
                  <MessageCircle size={15} />
                  Написать в WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        {part.description && (
          <div className="mt-8 bg-bg-surface border border-border rounded-lg p-5">
            <h2 className="font-semibold text-text-primary mb-3">Описание</h2>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {part.description}
            </p>
          </div>
        )}
      </PageContainer>

      {config && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-30 md:hidden px-4 pb-2">
          <div className="flex gap-3 p-3 bg-white/80 dark:bg-bg-surface/80 backdrop-blur-md rounded-2xl shadow-xl border border-border">
            <a
              href={`tel:${part.contact_phone ?? config.contact_phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-md"
            >
              <Phone size={17} />
              Позвонить
            </a>
            <a
              href={buildWaLink(part.contact_phone ?? config.contact_phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20b858] active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-md"
            >
              <MessageCircle size={17} />
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  )
}
