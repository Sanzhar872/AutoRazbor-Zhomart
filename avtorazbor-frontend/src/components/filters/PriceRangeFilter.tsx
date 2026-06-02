'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Input'

interface PriceRangeFilterProps {
  min?: number
  max?: number
  onChange: (min: number | undefined, max: number | undefined) => void
}

export function PriceRangeFilter({ min, max, onChange }: PriceRangeFilterProps) {
  const [localMin, setLocalMin] = useState(min?.toString() ?? '')
  const [localMax, setLocalMax] = useState(max?.toString() ?? '')

  const apply = () => {
    onChange(
      localMin ? Number(localMin) : undefined,
      localMax ? Number(localMax) : undefined
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        Цена, ₸
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="от"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          onBlur={apply}
          className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
        />
        <span className="text-text-muted text-sm flex-shrink-0">—</span>
        <input
          type="number"
          placeholder="до"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          onBlur={apply}
          className="w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
        />
      </div>
    </div>
  )
}
