'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { cn } from '@/lib/cn'
import type { Category } from '@/types/category'

interface CategoryFilterProps {
  selectedId?: string
  onChange: (id: string | undefined) => void
}

function hasDescendant(cat: Category, id: string): boolean {
  return cat.children.some((c) => c.id === id || hasDescendant(c, id))
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
  const hasChildren = cat.children.length > 0
  const containsSelected = !!selectedId && hasDescendant(cat, selectedId)

  const [open, setOpen] = useState(containsSelected)
  const [justSelected, setJustSelected] = useState(false)

  // Раскрываем если выбрана дочерняя категория
  useEffect(() => {
    if (containsSelected) setOpen(true)
  }, [containsSelected])

  // Анимация при выборе
  useEffect(() => {
    if (isSelected) {
      setJustSelected(true)
      const t = setTimeout(() => setJustSelected(false), 600)
      return () => clearTimeout(t)
    }
  }, [isSelected])

  const handleClick = () => {
    if (hasChildren) {
      setOpen((v) => !v)
      if (!isSelected) onChange(cat.id)
    } else {
      onChange(isSelected ? undefined : cat.id)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-left transition-all duration-150',
          depth > 0 && 'pl-6',
          isSelected
            ? 'bg-accent-muted text-accent font-medium'
            : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
          justSelected && 'scale-[0.97] ring-2 ring-accent/40'
        )}
      >
        {hasChildren ? (
          <ChevronRight
            size={14}
            className={cn('flex-shrink-0 transition-transform duration-200', open && 'rotate-90')}
          />
        ) : isSelected ? (
          <Check size={14} className="flex-shrink-0 text-accent" />
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}
        {cat.name}
      </button>

      {open && hasChildren && (
        <div className="mt-0.5">
          {cat.children.map((child) => (
            <CategoryItem
              key={child.id}
              cat={child}
              selectedId={selectedId}
              onChange={onChange}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
