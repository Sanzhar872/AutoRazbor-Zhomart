'use client'

import { useState } from 'react'
import { Plus, ChevronRight, ChevronDown, Trash2, Edit } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { client, getApiError } from '@/api/client'
import { queryKeys } from '@/constants/queryKeys'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { Category } from '@/types/category'

export function CategoriesAdminPageClient() {
  const qc = useQueryClient()
  const { data: categories, isLoading } = useCategories()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', parent_id: '' })

  const openCreate = (parent?: Category) => {
    setForm({ name: '', parent_id: parent?.id ?? '' })
    setModal('create')
  }

  const openEdit = (cat: Category) => {
    setSelected(cat)
    setForm({ name: cat.name, parent_id: cat.parent_id ?? '' })
    setModal('edit')
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (modal === 'create') {
        await client.post('/categories', {
          name: form.name,
          parent_id: form.parent_id || null,
        })
      } else if (modal === 'edit' && selected) {
        await client.patch(`/categories/${selected.id}`, { name: form.name })
      }
      qc.invalidateQueries({ queryKey: queryKeys.categories })
    },
    onSuccess: () => {
      toast.success(modal === 'create' ? 'Категория создана' : 'Сохранено')
      setModal(null)
      setSelected(null)
      setForm({ name: '', parent_id: '' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/categories/${id}`),
    onSuccess: () => {
      toast.success('Удалено')
      qc.invalidateQueries({ queryKey: queryKeys.categories })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Категории</h1>
          <Button size="sm" onClick={() => openCreate()}>
            <Plus size={14} /> Категория
          </Button>
        </div>

        {isLoading ? (
          <div className="text-text-muted text-sm py-8 text-center">Загрузка...</div>
        ) : (
          <div className="bg-bg-surface border border-border rounded-lg overflow-hidden">
            {categories?.length === 0 && (
              <p className="text-center text-text-muted text-sm py-10">Категорий пока нет</p>
            )}
            <div className="divide-y divide-border">
              {categories?.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  depth={0}
                  onAdd={openCreate}
                  onEdit={openEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => { setModal(null); setSelected(null) }}
        title={modal === 'create' ? 'Новая категория' : 'Редактировать категорию'}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Название"
            placeholder="Двигатель"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          {modal === 'create' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-secondary">Родительская категория</label>
              <select
                value={form.parent_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors"
              >
                <option value="">— Корневая —</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Отмена</Button>
            <Button
              onClick={() => mutation.mutate()}
              loading={mutation.isPending}
              disabled={!form.name.trim()}
              className="flex-1"
            >
              {modal === 'create' ? 'Создать' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function CategoryRow({
  cat, depth, onAdd, onEdit, onDelete,
}: {
  cat: Category
  depth: number
  onAdd: (parent: Category) => void
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}) {
  const hasChildren = cat.children.length > 0
  const [open, setOpen] = useState(true)

  return (
    <>
      <div
        className="flex items-center gap-2 py-2.5 hover:bg-bg-elevated transition-colors group"
        style={{ paddingLeft: `${16 + depth * 20}px`, paddingRight: '16px' }}
      >
        {/* Toggle button */}
        {hasChildren ? (
          <button
            onClick={() => setOpen(o => !o)}
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
            title={open ? 'Скрыть' : 'Показать'}
          >
            {open
              ? <ChevronDown size={14} />
              : <ChevronRight size={14} />
            }
          </button>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        <span className="flex-1 text-sm text-text-primary">{cat.name}</span>

        {hasChildren && (
          <span className="text-xs text-text-muted mr-1">
            {cat.children.length}
          </span>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAdd(cat)}
            className="p-1.5 text-text-muted hover:text-accent rounded transition-colors"
            title="Добавить подкатегорию"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onEdit(cat)}
            className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors"
            title="Редактировать"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(cat.id)}
            className="p-1.5 text-text-muted hover:text-danger rounded transition-colors"
            title="Удалить"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {hasChildren && open && (
        <div>
          {cat.children.map((child) => (
            <CategoryRow
              key={child.id}
              cat={child}
              depth={depth + 1}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </>
  )
}
