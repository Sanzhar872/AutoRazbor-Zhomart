'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUiStore } from '@/store/ui.store'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/cn'

export function SearchBar({ autoFocus, showButton }: { autoFocus?: boolean; showButton?: boolean }) {
  const { searchQuery, setSearchQuery } = useUiStore()
  const [local, setLocal] = useState(searchQuery)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!local.trim()) return
    setSearchQuery(local)
    router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(local.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', showButton && 'flex gap-2')}>
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          ref={inputRef}
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Поиск запчастей, OEM номер..."
          className={cn(
            'w-full pl-9 py-2 text-sm',
            showButton ? 'pr-3' : 'pr-8',
            'bg-bg-input border border-border rounded-md',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30',
            'transition-colors'
          )}
        />
        {local && !showButton && (
          <button
            type="button"
            onClick={() => setLocal('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {showButton && (
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
        >
          <Search size={15} />
          Искать
        </button>
      )}
    </form>
  )
}
