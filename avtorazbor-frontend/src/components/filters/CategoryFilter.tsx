'use client'

import { ChevronRight } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/cn'
import type { Category } from '@/types/category'

interface CategoryFilterProps {
  selectedId?: string
  onChange: (id: string | undefined) => void
}

export function CategoryFilter({ selectedId, onChange }: CategoryFilterProps) {
  const { data: categories } = useCategories()

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
        Категория
      </label>
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors w-full',
          !selectedId
            ? 'bg-accent-muted text-accent font-medium'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        )}
      >
        Все категории
      </button>
      {categories?.map((cat) => (
        <CategoryItem
          key={cat.id}
          cat={cat}
          selectedId={selectedId}
          onChange={onChange}
          depth={0}
        />
      ))}
    </div>
  )
}

function CategoryItem({
  cat,
  selectedId,
  onChange,
  depth,
}: {
  cat: Category
  selectedId?: string
  onChange: (id: string | undefined) => void
  depth: number
}) {
  const isSelected = selectedId === cat.id

  return (
    <div>
      <button
        onClick={() => onChange(isSelected ? undefined : cat.id)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-left transition-colors',
          depth > 0 && 'pl-6',
          isSelected
            ? 'bg-accent-muted text-accent font-medium'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
        )}
      >
        {cat.children.length > 0 && <ChevronRight size={14} className="flex-shrink-0" />}
        {cat.name}
      </button>
      {isSelected && cat.children.map((child) => (
        <CategoryItem
          key={child.id}
          cat={child}
          selectedId={selectedId}
          onChange={onChange}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}
