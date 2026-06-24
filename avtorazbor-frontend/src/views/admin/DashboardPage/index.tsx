'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, TrendingUp, AlertTriangle, Plus, ShoppingCart, TrendingDown, CalendarDays, CalendarRange, Calendar, Trash2, RotateCcw, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAdminDashboard, useReturnSale, useDeleteSale } from '@/hooks/useAdmin'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/formatPrice'
import { adminApi } from '@/api/admin.api'
import type { SaleRecord } from '@/api/admin.api'
import type { ElementType } from 'react'

export function DashboardPageClient() {
  const { data, isLoading } = useAdminDashboard()




  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-text-primary">Журнал</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!confirm('Удалить ВСЕ товары, продажи и журнал? Это нельзя отменить!')) return
                await adminApi.resetAll()
                window.location.reload()
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/30 text-sm font-medium rounded-md transition-colors"
            >
              <AlertTriangle size={15} />
              Сбросить всё
            </button>
            <Link
              href={ROUTES.ADMIN_PART_NEW}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors"
            >
              <Plus size={16} />
              Добавить запчасть
            </Link>
          </div>
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
                  {data?.recent_sales.filter(s => !s.is_return).map((sale) => (
                    <SaleRow key={sale.id} sale={sale} />
                  ))}
                </div>
              )}
            </div>

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

interface RevenueResult {
  revenue: number
  sales_total: number; sales_count: number; sales_qty: number
  returns_total: number; returns_count: number; returns_qty: number
}
interface SaleItem {
  id: string; title: string; qty: number; price_kzt: number; total_kzt: number
  comment: string; created_at: string | null; returned_at: string | null
}

function CustomRevenueWidget() {
  const today = new Date().toLocaleDateString('en-CA')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo]     = useState(today)
  const [result, setResult]     = useState<RevenueResult | null>(null)
  const [sales, setSales]       = useState<SaleItem[]>([])
  const [returns, setReturns]   = useState<SaleItem[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { mutate: returnSale }  = useReturnSale()

  const calculate = async () => {
    if (!dateFrom || !dateTo) return
    setLoading(true); setError('')
    try {
      const [rev, salesData, returnsData] = await Promise.all([
        adminApi.getRevenue(dateFrom, dateTo),
        adminApi.getSales({ date_from: dateFrom, date_to: dateTo, per_page: 100 }),
        adminApi.getSales({ status: 'returned', date_from: dateFrom, date_to: dateTo, per_page: 100 }),
      ])
      setResult(rev)
      setSales(salesData.items ?? [])
      setReturns(returnsData.items ?? [])
    } catch {
      setError('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const hasData = result !== null

  return (
    <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border">
        <p className="font-medium text-text-primary text-sm flex items-center gap-2">
          <Search size={15} className="text-accent" />
          Отчёт за период
        </p>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Date picker */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted font-medium">С</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 text-sm bg-bg-input border border-border rounded-md text-text-primary focus:outline-none focus:border-border-focus transition-colors" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-muted font-medium">По</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 text-sm bg-bg-input border border-border rounded-md text-text-primary focus:outline-none focus:border-border-focus transition-colors" />
          </div>
          <button onClick={calculate} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
            {loading ? 'Считаю...' : 'Посчитать'}
          </button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {hasData && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-success/5 border border-success/30 rounded-xl p-4 flex flex-col gap-1">
                <p className="text-xs font-medium text-success uppercase tracking-wider">💰 Чистая выручка</p>
                <p className="text-2xl font-bold text-success">
                  {result!.revenue >= 0 ? '+' : ''}{formatPrice(result!.revenue)}
                </p>
                <p className="text-xs text-text-muted">{dateFrom} — {dateTo}</p>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex flex-col gap-1">
                <p className="text-xs font-medium text-blue-500 uppercase tracking-wider">📈 Продажи</p>
                <p className="text-2xl font-bold text-text-primary">{formatPrice(result!.sales_total)}</p>
                <p className="text-xs text-text-muted">{sales.length} позиций · {result!.sales_qty} шт</p>
              </div>
              <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 flex flex-col gap-1">
                <p className="text-xs font-medium text-danger uppercase tracking-wider">📉 Возвраты</p>
                <p className="text-2xl font-bold text-danger">-{formatPrice(result!.returns_total)}</p>
                <p className="text-xs text-text-muted">{returns.length} позиций · {result!.returns_qty} шт</p>
              </div>
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sales list */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-blue-500/5 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Продажи</span>
                  <span className="text-xs text-text-muted">{sales.length} позиций</span>
                </div>
                {sales.length === 0
                  ? <p className="text-center text-text-muted text-sm py-6">Продаж нет</p>
                  : (
                    <div className="divide-y divide-border max-h-72 overflow-y-auto">
                      {sales.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-elevated/50 transition-colors group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                            <p className="text-xs text-text-muted">
                              {s.created_at ? new Date(s.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                              {s.comment ? ` · ${s.comment}` : ''}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-bold text-text-primary">{formatPrice(s.total_kzt)}</p>
                            <p className="text-xs text-text-muted">{s.qty} шт × {formatPrice(s.price_kzt)}</p>
                          </div>
                          <button
                            onClick={() => { if (confirm(`Вернуть «${s.title}»?`)) returnSale(s.id, { onSuccess: calculate }) }}
                            title="Вернуть товар"
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-warning hover:bg-warning/10 transition-all"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                {sales.length > 0 && (
                  <div className="px-4 py-2.5 bg-bg-elevated border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted font-medium">Итого</span>
                    <span className="text-sm font-bold text-blue-500">{formatPrice(result!.sales_total)}</span>
                  </div>
                )}
              </div>

              {/* Returns list */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-danger/5 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-danger uppercase tracking-wider">Возвраты</span>
                  <span className="text-xs text-text-muted">{returns.length} позиций</span>
                </div>
                {returns.length === 0
                  ? <p className="text-center text-text-muted text-sm py-6">Возвратов нет</p>
                  : (
                    <div className="divide-y divide-border max-h-72 overflow-y-auto">
                      {returns.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-elevated/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                            {s.comment && <p className="text-xs text-text-muted truncate">{s.comment}</p>}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-bold text-danger">-{formatPrice(s.total_kzt)}</p>
                            <p className="text-xs text-text-muted">{s.qty} шт × {formatPrice(s.price_kzt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                {returns.length > 0 && (
                  <div className="px-4 py-2.5 bg-bg-elevated border-t border-border flex items-center justify-between">
                    <span className="text-xs text-text-muted font-medium">Итого</span>
                    <span className="text-sm font-bold text-danger">-{formatPrice(result!.returns_total)}</span>
                  </div>
                )}
              </div>
            </div>
          </>
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
  const { mutate: returnSale, isPending: isReturning } = useReturnSale()
  const { mutate: deleteSale, isPending: isDeleting } = useDeleteSale()
  const isPending = isReturning || isDeleting
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
        <p className="text-xs text-text-muted truncate">
          {isReturn ? 'Возврат' : 'Продано'}{sale.comment ? ` · ${sale.comment}` : ''}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-bold ${isReturn ? 'text-warning' : 'text-success'}`}>
          {isReturn ? `-${formatPrice(Math.abs(sale.profit))}` : `+${formatPrice(sale.profit)}`}
        </p>
        <p className="text-xs text-text-muted">{sale.delta} шт · {timeAgo}</p>
      </div>
      {!isReturn && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
          <button
            onClick={() => returnSale(sale.id)}
            disabled={isPending}
            title="Вернуть товар на склад"
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-warning hover:bg-warning/10 transition-all disabled:opacity-40"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => { if (confirm('Удалить запись? Склад восстановится.')) deleteSale(sale.id) }}
            disabled={isPending}
            title="Удалить (ошибочная запись)"
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-all disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

