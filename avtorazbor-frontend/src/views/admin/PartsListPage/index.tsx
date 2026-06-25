'use client'

import { useState, Fragment, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Upload, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { partsApi } from '@/api/parts.api'
import { categoriesApi } from '@/api/categories.api'
import type { Category } from '@/types/category'
import { queryKeys } from '@/constants/queryKeys'
import { getApiError, client } from '@/api/client'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/formatPrice'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui/Modal'

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

interface ParsedRow { title: string; price: number; qty: number }

function flattenCategories(cats: Category[]): Category[] {
  const result: Category[] = []
  const walk = (list: Category[]) => list.forEach(c => { result.push(c); walk(c.children) })
  walk(cats)
  return result
}

function parseText(raw: string, carName: string): ParsedRow[] {
  const rows: ParsedRow[] = []
  const lines = raw.split('\n')
  for (const line of lines) {
    const cols = line.split('\t').map(s => s.trim())
    const partName = cols[0]
    if (!partName) continue
    if (partName.toLowerCase().startsWith('итого')) break
    const priceRaw = cols[1] ?? ''
    if (!priceRaw || priceRaw === '—') continue
    const price = parseFloat(priceRaw.replace(/\s/g, '').replace(',', '.'))
    if (!price || price <= 0) continue
    const qty = parseInt(cols[2] ?? '1') || 1
    const title = carName.trim() ? `${carName.trim()} - ${partName}` : partName
    rows.push({ title, price, qty })
  }
  return rows
}

function ImportModal({ open, onClose, categories, onSuccess }: {
  open: boolean; onClose: () => void
  categories: Category[]; onSuccess: () => void
}) {
  const [rawText, setRawText] = useState('')
  const [carName, setCarName] = useState('')
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [phone, setPhone] = useState('87759353595')
  const [status, setStatus] = useState('active')
  const [loading, setLoading] = useState(false)
  const flat = flattenCategories(categories)

  const handleParse = () => {
    const parsed = parseText(rawText, carName)
    setRows(parsed)
    if (parsed.length === 0) toast.error('Не удалось распознать товары')
  }

  const handleImport = async () => {
    if (!categoryId) { toast.error('Выберите категорию'); return }
    if (rows.length === 0) { toast.error('Нет товаров для импорта'); return }
    setLoading(true)
    try {
      const res = await client.post('/parts/import', {
        items: rows.map(r => ({ title: r.title, price: r.price, qty: r.qty })),
        category_id: categoryId,
        phone,
        status,
      }, { timeout: 60_000 })
      toast.success(`Импортировано ${res.data.created} товаров`)
      onSuccess()
      onClose()
      setRawText('')
      setCarName('')
      setRows([])
    } catch (e) {
      toast.error(getApiError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Импорт товаров">
      <div className="flex flex-col gap-4">
        {/* Настройки */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Категория *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus">
              <option value="">Выберите категорию</option>
              {flat.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Название машины</label>
            <input
              value={carName}
              onChange={e => setCarName(e.target.value)}
              placeholder="напр. 210 Лупарик 3.2 автомат рестайлинг"
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus"
            />
            <p className="text-xs text-text-muted">Будет добавлено к каждому товару: «Название машины - Запчасть»</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">Телефон</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text-secondary">Статус</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus">
                <option value="active">Активна</option>
                <option value="draft">Черновик</option>
              </select>
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">
            Вставьте данные из Excel (Tab-разделитель: название · цена · количество)
          </label>
          <textarea
            value={rawText}
            onChange={e => { setRawText(e.target.value); setRows([]) }}
            rows={8}
            placeholder={"Мотор\t500 000\t1\nКоробка\t120 000\t1\nКрыша\t—\t\nИтого\t1870000"}
            className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus font-mono resize-none"
          />
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="self-end px-3 py-1.5 border border-border rounded-md text-xs text-text-secondary hover:bg-bg-elevated transition-colors disabled:opacity-40"
          >
            Распознать
          </button>
        </div>

        {/* Предпросмотр */}
        {rows.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-bg-elevated border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Предпросмотр</span>
              <span className="text-xs text-success font-medium">{rows.length} товаров</span>
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-border">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2">
                  <CheckCircle size={14} className="text-success flex-shrink-0" />
                  <span className="flex-1 text-sm text-text-primary truncate">{r.title}</span>
                  <span className="text-xs text-text-muted">{r.qty} шт</span>
                  <span className="text-sm font-semibold text-text-primary whitespace-nowrap">{formatPrice(r.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-md text-sm text-text-secondary hover:bg-bg-elevated transition-colors">
            Отмена
          </button>
          <button onClick={handleImport} disabled={loading || rows.length === 0 || !categoryId}
            className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50">
            {loading ? 'Импортирую...' : `Импортировать ${rows.length} товаров`}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function PartsListPageClient() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [importOpen, setImportOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.parts({ page, per_page: 50, status: statusFilter, q: debouncedSearch, sort: 'category' }),
    queryFn: () => partsApi.list({ page, per_page: 50, status: statusFilter, q: debouncedSearch || undefined, sort: 'category' }),
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

  const deleteAllMutation = useMutation({
    mutationFn: partsApi.deleteAll,
    onSuccess: () => {
      toast.success('Все товары удалены')
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

            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-border bg-bg-elevated hover:bg-bg-surface text-text-primary text-sm font-medium rounded-md transition-colors whitespace-nowrap"
            >
              <Upload size={15} />
              Импорт CSV
            </button>
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
                  : grouped.map((group) => {
                    const key = `${group.parent ?? ''}-${group.name}`
                    const isCollapsed = collapsed.has(key)
                    return (
                    <Fragment key={key}>
                      <tr
                        className="cursor-pointer select-none"
                        onClick={() => setCollapsed(prev => {
                          const next = new Set(prev)
                          next.has(key) ? next.delete(key) : next.add(key)
                          return next
                        })}
                      >
                        <td colSpan={7} className="px-4 py-2 bg-bg-elevated border-y border-border">
                          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                            {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} className="rotate-90" />}
                            {group.parent && <>{group.parent} → </>}{group.name} ({group.items.length})
                          </span>
                        </td>
                      </tr>
                      {!isCollapsed && group.items.map((part) => {
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
                  )})}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-text-muted">Стр. {page} из {data.pages} · {data.total} товаров</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-bg-elevated transition-colors">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                  className="p-1.5 border border-border rounded-md disabled:opacity-40 hover:bg-bg-elevated transition-colors">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {categories && (
        <ImportModal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          categories={categories}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['parts'] })}
        />
      )}
    </>
  )
}
