import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUiStore } from '@/store/ui.store'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/cn'

export function SearchBar({ autoFocus }: { autoFocus?: boolean }) {
  const { searchQuery, setSearchQuery } = useUiStore()
  const [local, setLocal] = useState(searchQuery)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!local.trim()) return
    setSearchQuery(local)
    navigate(`${ROUTES.SEARCH}?q=${encodeURIComponent(local.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
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
            'w-full pl-9 pr-8 py-2 text-sm',
            'bg-bg-input border border-border rounded-md',
            'text-text-primary placeholder:text-text-muted',
            'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30',
            'transition-colors'
          )}
        />
        {local && (
          <button
            type="button"
            onClick={() => setLocal('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </form>
  )
}
