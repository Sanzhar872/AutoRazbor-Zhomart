'use client'

import { useCarMakes, useCarModels, useCarGenerations } from '@/hooks/useCars'
import { S } from '@/constants/strings.ru'

interface CarFilterProps {
  makeId?: string
  modelId?: string
  generationId?: string
  onChange: (field: 'make_id' | 'model_id' | 'generation_id', value: string | undefined) => void
}

export function CarFilter({ makeId, modelId, generationId, onChange }: CarFilterProps) {
  const { data: makes } = useCarMakes()
  const { data: models } = useCarModels(makeId)
  const { data: generations } = useCarGenerations(modelId)

  const selectClass =
    'w-full bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors'

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
        Автомобиль
      </label>

      <select
        className={selectClass}
        value={makeId ?? ''}
        onChange={(e) => {
          onChange('make_id', e.target.value || undefined)
          onChange('model_id', undefined)
          onChange('generation_id', undefined)
        }}
      >
        <option value="">{S.allMakes}</option>
        {makes?.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      {makeId && (
        <select
          className={selectClass}
          value={modelId ?? ''}
          onChange={(e) => {
            onChange('model_id', e.target.value || undefined)
            onChange('generation_id', undefined)
          }}
        >
          <option value="">{S.allModels}</option>
          {models?.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}

      {modelId && (
        <select
          className={selectClass}
          value={generationId ?? ''}
          onChange={(e) => onChange('generation_id', e.target.value || undefined)}
        >
          <option value="">{S.allGenerations}</option>
          {generations?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}{g.year_from ? ` (${g.year_from}–${g.year_to ?? '...'})` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
