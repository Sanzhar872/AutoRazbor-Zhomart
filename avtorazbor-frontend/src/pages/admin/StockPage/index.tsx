import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ShoppingCart, RotateCcw, Package } from 'lucide-react'
import { useAdminStock, useStockChange } from '@/hooks/useAdmin'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/formatPrice'
import { getFavoriteSlots } from '@/lib/favoriteSlots'
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

type ModalMode = 'sold' | 'return' | null

export function StockPage() {
  const { data: items, isLoading } = useAdminStock()
  const { mutate: changeStock, isPending } = useStockChange()

  const [selected, setSelected] = useState<StockItem | null>(null)
  const [mode, setMode] = useState<ModalMode>(null)
  const [qty, setQty] = useState('1')
  const [comment, setComment] = useState('')

  const open = (item: StockItem, m: ModalMode) => {
    setSelected(item)
    setMode(m)
    setQty('1')
    setComment('')
  }

  const close = () => {
    setSelected(null)
    setMode(null)
    setQty('1')
    setComment('')
  }

  const handleConfirm = () => {
    if (!selected || !qty || Number(qty) < 1) return
    changeStock(
      {
        partId: selected.id,
        action: mode === 'sold' ? 'decrease' : 'increase',
        value: Number(qty),
        comment: comment || (mode === 'sold' ? 'Продано' : 'Возврат'),
      },
      { onSuccess: close }
    )
  }

  const stockAfter = selected
    ? mode === 'sold'
      ? selected.stock - Number(qty || 0)
      : selected.stock + Number(qty || 0)
    : 0

  const stockAfterClamped = Math.max(0, stockAfter)

  return (
    <>
      <Helmet><title>Управление складом — Администрация</title></Helmet>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Склад</h1>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
              В наличии
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block" />
              Мало
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block" />
              Нет
            </span>
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
                      <tr key={i}>
                        <td colSpan={5} className="px-4 py-3">
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  : (items as StockItem[])?.map((item) => (
                      <tr key={item.id} className="hover:bg-bg-elevated/40 transition-colors group">
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="text-text-primary font-medium truncate">{item.title}</p>
                          <p className="text-xs text-text-muted mt-0.5">{item.status === 'active' ? 'Активна' : item.status === 'sold_out' ? 'Нет в наличии' : 'Черновик'}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary whitespace-nowrap">
                          {formatPrice(item.price_kzt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'inline-flex items-center gap-1 font-semibold text-base',
                            item.stock === 0 ? 'text-danger' : item.stock < 5 ? 'text-warning' : 'text-success'
                          )}>
                            <span className={cn(
                              'w-2 h-2 rounded-full',
                              item.stock === 0 ? 'bg-danger' : item.stock < 5 ? 'bg-warning' : 'bg-success'
                            )} />
                            {item.stock} шт
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-text-secondary hidden md:table-cell">
                          {item.favorites_count}/{item.max_favorite_slots}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => open(item, 'sold')}
                              disabled={item.stock === 0}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <ShoppingCart size={13} />
                              Продано
                            </button>
                            <button
                              onClick={() => open(item, 'return')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white transition-all"
                            >
                              <RotateCcw size={13} />
                              Вернуть
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={!!selected && !!mode}
        onClose={close}
        title={mode === 'sold' ? 'Отметить продажу' : 'Вернуть товар'}
      >
        {selected && (
          <div className="flex flex-col gap-4">
            {/* Part info */}
            <div className={cn(
              'flex items-start gap-3 p-3 rounded-lg border',
              mode === 'sold' ? 'bg-danger/5 border-danger/20' : 'bg-success/5 border-success/20'
            )}>
              <Package size={18} className={mode === 'sold' ? 'text-danger mt-0.5' : 'text-success mt-0.5'} />
              <div>
                <p className="font-medium text-text-primary text-sm">{selected.title}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Текущий остаток: <strong className="text-text-primary">{selected.stock} шт</strong>
                </p>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">
                {mode === 'sold' ? 'Сколько единиц продано?' : 'Сколько единиц вернуть?'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQty(String(Math.max(1, Number(qty) - 1)))}
                  className="w-9 h-9 rounded-md border border-border bg-bg-elevated text-text-primary hover:border-border-focus transition-colors text-lg font-bold flex items-center justify-center"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={mode === 'sold' ? selected.stock : 999}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="flex-1 text-center bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors font-semibold text-base"
                />
                <button
                  type="button"
                  onClick={() => setQty(String(Math.min(mode === 'sold' ? selected.stock : 999, Number(qty) + 1)))}
                  className="w-9 h-9 rounded-md border border-border bg-bg-elevated text-text-primary hover:border-border-focus transition-colors text-lg font-bold flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Preview */}
            {qty && Number(qty) > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-md bg-bg-elevated border border-border text-sm">
                <span className="text-text-secondary">Остаток после:</span>
                <span className={cn(
                  'font-bold text-base',
                  stockAfterClamped === 0 ? 'text-danger' : stockAfterClamped < 5 ? 'text-warning' : 'text-success'
                )}>
                  {stockAfterClamped} шт
                  {mode === 'sold' && stockAfterClamped === 0 && (
                    <span className="text-xs font-normal text-danger ml-1">(статус → «Нет в наличии»)</span>
                  )}
                </span>
              </div>
            )}

            {/* Comment */}
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={mode === 'sold' ? 'Комментарий (покупатель, договор...)' : 'Причина возврата...'}
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
            />

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" onClick={close} className="flex-1">
                Отмена
              </Button>
              <Button
                onClick={handleConfirm}
                loading={isPending}
                disabled={!qty || Number(qty) < 1 || (mode === 'sold' && Number(qty) > selected.stock)}
                className={cn(
                  'flex-1',
                  mode === 'sold'
                    ? 'bg-danger hover:bg-danger/80'
                    : 'bg-success hover:bg-success/80'
                )}
              >
                {mode === 'sold' ? `Продано ${qty} шт` : `Вернуть ${qty} шт`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
