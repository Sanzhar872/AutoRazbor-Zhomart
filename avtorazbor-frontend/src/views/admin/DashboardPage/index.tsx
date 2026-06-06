'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, TrendingUp, AlertTriangle, Plus, ShoppingCart, TrendingDown, CalendarDays, CalendarRange, Calendar, Trash2, RotateCcw, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAdminDashboard, useDeleteSale, useRestoreSale, usePermanentDeleteSale } from '@/hooks/useAdmin'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/formatPrice'
import { adminApi } from '@/api/admin.api'
import type { SaleRecord } from '@/api/admin.api'
import type { ElementType } from 'react'

export function DashboardPageClient() {
  const { data, isLoading } = useAdminDashboard()
  const [trashOpen, setTrashOpen] = useState(false)

  const hasDeleted = (data?.deleted_sales?.length ?? 0) > 0

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Журнал</h1>
          <Link
            href={ROUTES.ADMIN_PART_NEW}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus size={16} />
            Добавить запчасть
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)
            : (
              <>
                <StatCard icon={Package}      label="Всего позиций"  value={data?.total_parts ?? 0}    color="text-accent" />
                <StatCard icon={TrendingUp}   label="Активных"       value={data?.active_parts ?? 0}   color="text-success" />
                <StatCard icon={AlertTriangle} label="Дефицит < 5 шт" value={data?.low_stock_parts ?? 0} color="text-warning" />
                <StatCard icon={Plus}         label="Добавлено сегодня" value={data?.added_today ?? 0} color="text-text-secondary" />
                <StatCard icon={ShoppingCart} label="Продано сегодня" value={data?.sold_today ?? 0}    color="text-success" suffix="шт" />
                <StatCard icon={TrendingDown} label="Всего продаж"   value={data?.sold_total ?? 0}     color="text-text-muted" suffix="шт" />
              </>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent sales */}
          <div className="flex flex-col gap-3">
            <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <p className="font-medium text-text-primary text-sm flex items-center gap-2">
                  <ShoppingCart size={15} className="text-success" />
                  Последние продажи
                </p>
                <Link href={ROUTES.ADMIN_STOCK} className="text-xs text-accent hover:underline">
                  Склад →
                </Link>
              </div>
              {isLoading ? (
                <div className="p-4 flex flex-col gap-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : !data?.recent_sales?.length ? (
                <p className="text-center text-text-muted text-sm py-8">Продаж ещё не было</p>
              ) : (
                <div className="divide-y divide-border">
                  {data?.recent_sales.map((sale) => (
                    <SaleRow key={sale.id} sale={sale} />
                  ))}
                </div>
              )}
            </div>

            {/* Trash */}
            {!isLoading && hasDeleted && (
              <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setTrashOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 border-b border-border hover:bg-bg-elevated/40 transition-colors"
                >
                  <p className="font-medium text-text-muted text-sm flex items-center gap-2">
                    <Trash2 size={14} className="text-danger" />
                    Корзина
                    <span className="bg-danger/15 text-danger text-xs px-1.5 py-0.5 rounded-full font-semibold">
                      {data?.deleted_sales.length}
                    </span>
                  </p>
                  {trashOpen ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                </button>
                {trashOpen && (
                  <div className="divide-y divide-border">
                    {data?.deleted_sales.map((sale) => (
                      <DeletedSaleRow key={sale.id} sale={sale} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top favorites */}
          <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="font-medium text-text-primary text-sm">Топ-5 в избранном</p>
            </div>
            {isLoading ? (
              <div className="p-4 flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : !data?.top_favorites?.length ? (
              <p className="text-center text-text-muted text-sm py-8">Нет данных</p>
            ) : (
              <div className="divide-y divide-border">
                {data.top_favorites.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-xs text-text-muted w-4 font-mono">{i + 1}</span>
                    <p className="flex-1 text-sm text-text-primary truncate">{item.title}</p>
                    <span className="text-sm font-semibold text-accent">{item.favorites} ♥</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Revenue by period */}
        <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="font-medium text-text-primary text-sm flex items-center gap-2">
              <TrendingUp size={15} className="text-success" />
              Выручка по периодам
            </p>
          </div>
          {isLoading ? (
            <div className="p-4 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <RevenueCard icon={CalendarDays}  label="Сегодня"      value={data?.revenue.today ?? 0} />
              <RevenueCard icon={CalendarRange} label="Эта неделя"   value={data?.revenue.week ?? 0} />
              <RevenueCard icon={Calendar}      label="Этот месяц"   value={data?.revenue.month ?? 0} />
            </div>
          )}
        </div>

        {/* Custom period revenue */}
        <CustomRevenueWidget />
      </div>
    </>
  )
}

function CustomRevenueWidget() {
  const today = new Date().toISOString().slice(0, 10)
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo]     = useState(today)
  const [result, setResult]     = useState<null | {
    revenue: number; sales_total: number; returns_total: number
    sales_count: number; returns_count: number
  }>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const calculate = async () => {
    if (!dateFrom || !dateTo) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await adminApi.getRevenue(dateFrom, dateTo)
      setResult(data)
    } catch {
      setError('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <p className="font-medium text-text-primary text-sm flex items-center gap-2">
          <Search size={15} className="text-accent" />
          Выручка за произвольный период
        </p>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">С</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm bg-bg-input border border-border rounded-md text-text-primary focus:outline-none focus:border-border-focus transition-colors" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted">По</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm bg-bg-input border border-border rounded-md text-text-primary focus:outline-none focus:border-border-focus transition-colors" />
          </div>
          <button onClick={calculate} disabled={loading}
            className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
            {loading ? 'Считаю...' : 'Посчитать'}
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">Чистая выручка</p>
              <p className="text-xl font-bold text-success">+{formatPrice(result.revenue)}</p>
            </div>
            <div className="bg-bg-elevated border border-border rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">Продаж</p>
              <p className="text-xl font-bold text-text-primary">{formatPrice(result.sales_total)}</p>
              <p className="text-xs text-text-muted">{result.sales_count} шт</p>
            </div>
            <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">Возвратов</p>
              <p className="text-xl font-bold text-danger">-{formatPrice(result.returns_total)}</p>
              <p className="text-xs text-text-muted">{result.returns_count} шт</p>
            </div>
            <div className="bg-bg-elevated border border-border rounded-lg p-4">
              <p className="text-xs text-text-muted mb-1">Транзакций</p>
              <p className="text-xl font-bold text-text-primary">{result.sales_count + result.returns_count}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, suffix }: {
  icon: ElementType; label: string; value: number; color: string; suffix?: string
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
      <Icon size={18} className={color} />
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted leading-tight">{label}{suffix ? ` · ${suffix}` : ''}</p>
    </div>
  )
}

function RevenueCard({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <div className="px-6 py-5 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-text-muted text-xs"><Icon size={13} />{label}</div>
      <p className="text-2xl font-bold text-success">
        {value > 0 ? `+${formatPrice(value)}` : formatPrice(value)}
      </p>
    </div>
  )
}

function SaleRow({ sale }: { sale: SaleRecord }) {
  const { mutate: deleteSale, isPending } = useDeleteSale()
  const timeAgo = sale.sold_at
    ? formatDistanceToNow(new Date(sale.sold_at), { addSuffix: true, locale: ru })
    : ''
  const isReturn = sale.is_return

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-bg-elevated/40 transition-colors group">
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isReturn ? 'bg-warning/10' : 'bg-success/10'}`}>
        {isReturn ? <RotateCcw size={13} className="text-warning" /> : <ShoppingCart size={13} className="text-success" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{sale.title}</p>
        <p className="text-xs text-text-muted truncate">{isReturn ? 'Возврат' : 'Продано'}{sale.comment ? ` · ${sale.comment}` : ''}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-bold ${isReturn ? 'text-warning' : 'text-success'}`}>
          {isReturn ? `-${formatPrice(Math.abs(sale.profit))}` : `+${formatPrice(sale.profit)}`}
        </p>
        <p className="text-xs text-text-muted">{sale.delta} шт · {timeAgo}</p>
      </div>
      {!isReturn && (
        <button
          onClick={() => deleteSale(sale.id)}
          disabled={isPending}
          title="Удалить в корзину"
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

function DeletedSaleRow({ sale }: { sale: SaleRecord }) {
  const { mutate: restoreSale, isPending: isRestoring } = useRestoreSale()
  const { mutate: permanentDelete, isPending: isDeleting } = usePermanentDeleteSale()
  const isPending = isRestoring || isDeleting
  const deletedAgo = sale.deleted_at
    ? formatDistanceToNow(new Date(sale.deleted_at), { addSuffix: true, locale: ru })
    : ''

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 opacity-60 hover:opacity-100 transition-opacity">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-danger/10 flex items-center justify-center">
        <Trash2 size={13} className="text-danger" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate line-through">{sale.title}</p>
        <p className="text-xs text-text-muted">удалено {deletedAgo}</p>
      </div>
      <div className="flex-shrink-0 text-right mr-1">
        <p className="text-sm font-bold text-text-muted line-through">{formatPrice(sale.profit)}</p>
        <p className="text-xs text-text-muted">{sale.delta} шт</p>
      </div>
      <button
        onClick={() => restoreSale(sale.id)}
        disabled={isPending}
        title="Восстановить"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-success hover:bg-success/10 transition-all disabled:opacity-40"
      >
        <RotateCcw size={14} />
      </button>
      <button
        onClick={() => permanentDelete(sale.id)}
        disabled={isPending}
        title="Удалить навсегда"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
