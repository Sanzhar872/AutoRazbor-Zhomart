'use client'

import { useState, Fragment, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { partsApi } from '@/api/parts.api'
import { categoriesApi } from '@/api/categories.api'
import type { Category } from '@/types/category'
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

function buildParentMap(cats: Category[]): Map<string, string> {
  const map = new Map<string, Category>()
  const flat = (list: Category[]) => list.forEach(c => { map.set(c.id, c); flat(c.children) })
  flat(cats)
  const parentName = new Map<string, string>()
  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      parentName.set(cat.id, map.get(cat.parent_id)!.name)
    }
  })
  return parentName
}

function groupByCategory(
  items: import('@/types/part').PartListItem[],
  parentMap: Map<string, string>
) {
  const map = new Map<string, { name: string; parent: string | null; items: import('@/types/part').PartListItem[] }>()
  for (const part of items) {
    const key = part.category.id
    if (!map.has(key)) map.set(key, {
      name: part.category.name,
      parent: parentMap.get(part.category.id) ?? null,
      items: [],
    })
    map.get(key)!.items.push(part)
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function PartsListPageClient() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.parts({ page: 1, per_page: 500, status: statusFilter, q: debouncedSearch }),
    queryFn: () => partsApi.list({ page: 1, per_page: 500, status: statusFilter, q: debouncedSearch || undefined }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  })

  const parentMap = categories ? buildParentMap(categories) : new Map<string, string>()

  const grouped = groupByCategory(data?.items ?? [], parentMap)

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
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-text-primary">Запчасти</h1>
              {data && (
                <span className="text-sm text-text-muted">({data.total})</span>
              )}
            </div>
            <Link
              href={ROUTES.ADMIN_PART_NEW}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
            >
              <Plus size={15} />
              Добавить
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-bg-input border border-border rounded-md text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
              />
            </div>
            <div className="flex gap-1 bg-bg-elevated border border-border rounded-lg p-1 overflow-x-auto">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value) }}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                    statusFilter === opt.value
                      ? 'bg-bg-surface text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
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
                  : grouped.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-muted text-sm">
                        Запчастей нет
                      </td>
                    </tr>
                  )
                  : grouped.map((group) => (
                    <Fragment key={`cat-${group.name}`}>
                      <tr>
                        <td colSpan={7} className="px-4 py-2 bg-bg-elevated border-y border-border">
                          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                            {group.parent && <>{group.parent} → </>}{group.name} ({group.items.length})
                          </span>
                        </td>
                      </tr>
                      {group.items.map((part) => {
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
                    </Fragment>
                  ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  )
}
