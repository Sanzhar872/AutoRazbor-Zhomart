import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Package, TrendingUp, AlertTriangle, Plus, ShoppingCart, TrendingDown, CalendarDays, CalendarRange, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useAdminDashboard } from '@/hooks/useAdmin'
import { Skeleton } from '@/components/ui/Skeleton'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/formatPrice'
import type { SaleRecord } from '@/api/admin.api'
import type { ElementType } from 'react'

export function DashboardPage() {
  const { data, isLoading } = useAdminDashboard()

  return (
    <>
      <Helmet><title>Журнал — Администрация</title></Helmet>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Журнал</h1>
          <Link
            to={ROUTES.ADMIN_PART_NEW}
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
          <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="font-medium text-text-primary text-sm flex items-center gap-2">
                <ShoppingCart size={15} className="text-success" />
                Последние продажи
              </p>
              <Link to={ROUTES.ADMIN_STOCK} className="text-xs text-accent hover:underline">
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
                {data.recent_sales.map((sale, i) => (
                  <SaleRow key={i} sale={sale} />
                ))}
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
              <RevenueCard
                icon={CalendarDays}
                label="Сегодня"
                value={data?.revenue.today ?? 0}
              />
              <RevenueCard
                icon={CalendarRange}
                label="Эта неделя"
                value={data?.revenue.week ?? 0}
              />
              <RevenueCard
                icon={Calendar}
                label="Этот месяц"
                value={data?.revenue.month ?? 0}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function StatCard({
  icon: Icon, label, value, color, suffix,
}: {
  icon: ElementType
  label: string
  value: number
  color: string
  suffix?: string
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-lg p-4 flex flex-col gap-2">
      <Icon size={18} className={color} />
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-muted leading-tight">
        {label}{suffix ? ` · ${suffix}` : ''}
      </p>
    </div>
  )
}

function RevenueCard({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <div className="px-6 py-5 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-text-muted text-xs">
        <Icon size={13} />
        {label}
      </div>
      <p className="text-2xl font-bold text-success">
        {value > 0 ? `+${formatPrice(value)}` : formatPrice(value)}
      </p>
    </div>
  )
}

function SaleRow({ sale }: { sale: SaleRecord }) {
  const timeAgo = sale.sold_at
    ? formatDistanceToNow(new Date(sale.sold_at), { addSuffix: true, locale: ru })
    : ''

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-bg-elevated/40 transition-colors">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-success/10 flex items-center justify-center">
        <ShoppingCart size={13} className="text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate">{sale.title}</p>
        {sale.comment && (
          <p className="text-xs text-text-muted truncate">{sale.comment}</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-success">
          +{formatPrice(sale.profit)}
        </p>
        <p className="text-xs text-text-muted">
          {sale.delta} шт · {timeAgo}
        </p>
      </div>
    </div>
  )
}
