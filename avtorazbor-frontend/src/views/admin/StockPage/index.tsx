'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAdminStock, useCreateSale } from '@/hooks/useAdmin'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/formatPrice'
import { cn } from '@/lib/cn'

interface StockItem {
  id: string
  title: string
  price_kzt: number
  stock: number
  status: string
  slug: string
  favorites_count: number
  max_favorite_slots: number
}

export function StockPageClient() {
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('q') ?? ''
    }
    return ''
  })
  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<StockItem | null>(null)
  const [qty, setQty] = useState('1')
  const [comment, setComment] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useAdminStock(debouncedSearch || undefined, page)
  const items = Array.isArray(data) ? data : data?.items ?? []
  const totalPages = Array.isArray(data) ? 1 : (data?.pages ?? 1)
  const totalItems = Array.isArray(data) ? items.length : (data?.total ?? 0)

  const { mutate: createSale, isPending } = useCreateSale()

  const open = (item: StockItem) => {
    setSelected(item)
    setQty('1')
    setComment('')
  }

  const close = () => { setSelected(null); setQty('1'); setComment('') }

  const handleSell = () => {
    if (!selected || Number(qty) < 1) return
    createSale(
      { partId: selected.id, qty: Number(qty), comment: comment || 'Продажа' },
      { onSuccess: close }
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-text-primary">Склад</h1>
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-bg-input border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />В наличии</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />Мало</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" />Нет</span>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated text-text-muted font-medium">
                  <th className="text-left px-4 py-3">Запчасть</th>
                  <th className="text-right px-4 py-3 whitespace-nowrap">Цена</th>
                  <th className="text-right px-4 py-3">Остаток</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Слоты ♥</th>
                  <th className="px-4 py-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td></tr>
                    ))
                  : items.map((item: StockItem) => (
                      <tr key={item.id} className="hover:bg-bg-elevated/40 transition-colors group">
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="text-text-primary font-medium truncate">{item.title}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {item.status === 'active' ? 'Активна' : item.status === 'sold_out' ? 'Нет в наличии' : 'Черновик'}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary whitespace-nowrap">
                          {formatPrice(item.price_kzt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'inline-flex items-center gap-1 font-semibold text-base',
                            item.stock === 0 ? 'text-danger' : item.stock < 5 ? 'text-warning' : 'text-success'
                          )}>
                            <span className={cn('w-2 h-2 rounded-full', item.stock === 0 ? 'bg-danger' : item.stock < 5 ? 'bg-warning' : 'bg-success')} />
                            {item.stock} шт
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary hidden md:table-cell">
                          {item.favorites_count}/{item.max_favorite_slots}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => open(item)}
                              disabled={item.stock === 0}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <ShoppingCart size={13} />
                              Продать
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-text-muted">Стр. {page} из {totalPages} · {totalItems} товаров</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-bg-elevated transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-bg-elevated transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={!!selected} onClose={close} title="Отметить продажу">
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-success/5 border-success/20">
              <Package size={18} className="text-success mt-0.5" />
              <div>
                <p className="font-medium text-text-primary text-sm">{selected.title}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  В наличии: <strong className="text-text-primary">{selected.stock} шт</strong>
                  {' · '}Цена: <strong className="text-text-primary">{formatPrice(selected.price_kzt)}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Сколько единиц продано?</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQty(String(Math.max(1, Number(qty) - 1)))}
                  className="w-9 h-9 rounded-md border border-border bg-bg-elevated text-text-primary hover:border-border-focus transition-colors text-lg font-bold flex items-center justify-center">−</button>
                <input
                  type="number" min={1} max={selected.stock} value={qty}
                  onChange={(e) => setQty(String(Math.max(1, Math.min(selected.stock, Number(e.target.value) || 1))))}
                  className="flex-1 text-center bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors font-semibold text-base"
                />
                <button type="button" onClick={() => setQty(String(Math.min(selected.stock, Number(qty) + 1)))}
                  className="w-9 h-9 rounded-md border border-border bg-bg-elevated text-text-primary hover:border-border-focus transition-colors text-lg font-bold flex items-center justify-center">+</button>
              </div>
            </div>

            {Number(qty) > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-bg-elevated border border-border text-sm">
                <span className="text-text-secondary">Итого:</span>
                <span className="font-bold text-success text-base">{formatPrice(selected.price_kzt * Number(qty))}</span>
              </div>
            )}

            <input
              type="text" value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (покупатель, договор...)"
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            />

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={close} className="flex-1">Отмена</Button>
              <Button onClick={handleSell} loading={isPending} disabled={!qty || Number(qty) < 1} className="flex-1 bg-success hover:bg-success/80">
                Продано {qty} шт
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
