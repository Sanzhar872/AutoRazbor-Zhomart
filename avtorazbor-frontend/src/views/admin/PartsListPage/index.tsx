'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { partsApi } from '@/api/parts.api'
import { queryKeys } from '@/constants/queryKeys'
import { getApiError } from '@/api/client'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/formatPrice'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/cn'

const STATUS_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'draft', label: 'Черновики' },
  { value: 'sold_out', label: 'Нет в наличии' },
  { value: 'archived', label: 'Архив' },
]

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'danger' | 'neutral' | 'warning' }> = {
  active:   { label: 'Активна',       variant: 'success' },
  sold_out: { label: 'Нет в наличии', variant: 'danger'  },
  draft:    { label: 'Черновик',      variant: 'neutral' },
  archived: { label: 'Архив',         variant: 'warning' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function PartsListPageClient() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.parts({ page, per_page: 20, status: statusFilter }),
    queryFn: () => partsApi.list({ page, per_page: 20, status: statusFilter }),
  })

  const deleteMutation = useMutation({
    mutationFn: partsApi.delete,
    onSuccess: () => {
      toast.success('Запчасть удалена')
      qc.invalidateQueries({ queryKey: ['parts'] })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-text-primary">Запчасти</h1>
            {data && (
              <span className="text-sm text-text-muted">({data.total})</span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex gap-1 bg-bg-elevated border border-border rounded-lg p-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    statusFilter === opt.value
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Link
              href={ROUTES.ADMIN_PART_NEW}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
            >
              <Plus size={15} />
              Добавить
            </Link>
          </div>
        </div>

        <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-elevated">
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Название</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">Категория</th>
                  <th className="text-right px-4 py-3 text-text-muted font-medium">Цена</th>
                  <th className="text-right px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Остаток</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium hidden lg:table-cell">Добавлен</th>
                  <th className="text-left px-4 py-3 text-text-muted font-medium">Статус</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7} className="px-4 py-3">
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  : data?.items.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-muted text-sm">
                        Запчастей нет
                      </td>
                    </tr>
                  )
                  : data?.items.map((part) => {
                      const badge = STATUS_BADGE[part.status] ?? { label: part.status, variant: 'neutral' as const }
                      return (
                        <tr key={part.id} className="hover:bg-bg-elevated/50 transition-colors">
                          <td className="px-4 py-3 max-w-[220px]">
                            <Link
                              href={ROUTES.PART(part.slug)}
                              target="_blank"
                              className="text-text-primary hover:text-accent transition-colors line-clamp-1"
                            >
                              {part.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                            {part.category.name}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-text-primary">
                            {formatPrice(part.price_kzt)}
                          </td>
                          <td className="px-4 py-3 text-right hidden lg:table-cell">
                            <span className={
                              part.stock === 0
                                ? 'text-danger font-medium'
                                : part.stock < 5
                                ? 'text-warning font-medium'
                                : 'text-text-primary'
                            }>
                              {part.stock} шт
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted whitespace-nowrap hidden lg:table-cell">
                            {formatDate(part.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <Link
                                href={ROUTES.ADMIN_PART_EDIT(part.slug)}
                                className="p-1.5 text-text-muted hover:text-text-primary transition-colors rounded"
                                title="Редактировать"
                              >
                                <Edit size={14} />
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm(`Удалить «${part.title}»?`)) {
                                    deleteMutation.mutate(part.id)
                                  }
                                }}
                                className="p-1.5 text-text-muted hover:text-danger transition-colors rounded"
                                title="Удалить"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-text-muted">
                Стр. {page} из {data.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-bg-elevated transition-colors"
                >
                  ← Назад
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="px-3 py-1.5 text-xs border border-border rounded-md disabled:opacity-40 hover:bg-bg-elevated transition-colors"
                >
                  Вперёд →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
