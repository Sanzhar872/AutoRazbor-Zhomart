import { cn } from '@/lib/cn'
import { S } from '@/constants/strings.ru'
import type { PartCondition } from '@/types/part'

const options: { value: PartCondition; label: string }[] = [
  { value: 'good', label: S.conditionGood },
  { value: 'fair', label: S.conditionFair },
  { value: 'poor', label: S.conditionPoor },
]

interface ConditionFilterProps {
  value?: PartCondition
  onChange: (v: PartCondition | undefined) => void
}

export function ConditionFilter({ value, onChange }: ConditionFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        Состояние
      </label>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.checked ? opt.value : undefined)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
