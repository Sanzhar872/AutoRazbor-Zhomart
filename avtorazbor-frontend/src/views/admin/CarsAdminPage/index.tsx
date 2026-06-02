'use client'

import { useState } from 'react'
import { Plus, ChevronRight, ChevronDown, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { carsApi } from '@/api/cars.api'
import { client, getApiError } from '@/api/client'
import { queryKeys } from '@/constants/queryKeys'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { CarMake, CarModel, CarGeneration } from '@/types/car'

export function CarsAdminPageClient() {
  const qc = useQueryClient()
  const [selectedMake, setSelectedMake] = useState<CarMake | null>(null)
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null)
  const [modal, setModal] = useState<'make' | 'model' | 'generation' | null>(null)
  const [form, setForm] = useState({ name: '', year_from: '', year_to: '' })

  const { data: makes, isLoading } = useQuery({ queryKey: queryKeys.cars, queryFn: carsApi.getMakes })
  const { data: models } = useQuery({
    queryKey: queryKeys.carModels(selectedMake?.id ?? ''),
    queryFn: () => carsApi.getModels(selectedMake!.id),
    enabled: !!selectedMake,
  })
  const { data: generations } = useQuery({
    queryKey: queryKeys.carGenerations(selectedModel?.id ?? ''),
    queryFn: () => carsApi.getGenerations(selectedModel!.id),
    enabled: !!selectedModel,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (modal === 'make') {
        await client.post('/cars/makes', { name: form.name })
        qc.invalidateQueries({ queryKey: queryKeys.cars })
      } else if (modal === 'model' && selectedMake) {
        await client.post(`/cars/makes/${selectedMake.id}/models`, { name: form.name })
        qc.invalidateQueries({ queryKey: queryKeys.carModels(selectedMake.id) })
      } else if (modal === 'generation' && selectedModel) {
        await client.post(`/cars/models/${selectedModel.id}/generations`, {
          name: form.name,
          year_from: form.year_from ? Number(form.year_from) : null,
          year_to: form.year_to ? Number(form.year_to) : null,
        })
        qc.invalidateQueries({ queryKey: queryKeys.carGenerations(selectedModel.id) })
      }
    },
    onSuccess: () => {
      toast.success('Создано')
      setModal(null)
      setForm({ name: '', year_from: '', year_to: '' })
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text-primary">Справочник автомобилей</h1>
          <Button size="sm" onClick={() => setModal('make')}>
            <Plus size={14} /> Марка
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Марки */}
          <Panel
            title="Марки"
            onAdd={() => setModal('make')}
            addLabel="Добавить марку"
          >
            {makes?.map((make) => (
              <PanelItem
                key={make.id}
                label={make.name}
                active={selectedMake?.id === make.id}
                hasChildren
                onClick={() => { setSelectedMake(make); setSelectedModel(null) }}
              />
            ))}
          </Panel>

          {/* Модели */}
          <Panel
            title={selectedMake ? `Модели: ${selectedMake.name}` : 'Модели'}
            onAdd={selectedMake ? () => setModal('model') : undefined}
            addLabel="Добавить модель"
            empty={!selectedMake ? 'Выберите марку' : undefined}
          >
            {models?.map((model) => (
              <PanelItem
                key={model.id}
                label={model.name}
                active={selectedModel?.id === model.id}
                hasChildren
                onClick={() => setSelectedModel(model)}
              />
            ))}
          </Panel>

          {/* Поколения */}
          <Panel
            title={selectedModel ? `Поколения: ${selectedModel.name}` : 'Поколения'}
            onAdd={selectedModel ? () => setModal('generation') : undefined}
            addLabel="Добавить поколение"
            empty={!selectedModel ? 'Выберите модель' : undefined}
          >
            {generations?.map((gen) => (
              <PanelItem
                key={gen.id}
                label={`${gen.name}${gen.year_from ? ` (${gen.year_from}–${gen.year_to ?? '...'})` : ''}`}
              />
            ))}
          </Panel>
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={!!modal}
        onClose={() => { setModal(null); setForm({ name: '', year_from: '', year_to: '' }) }}
        title={
          modal === 'make' ? 'Новая марка' :
          modal === 'model' ? 'Новая модель' :
          'Новое поколение'
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Название"
            placeholder={modal === 'make' ? 'Toyota' : modal === 'model' ? 'Camry' : 'V50'}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          {modal === 'generation' && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Год с"
                type="number"
                placeholder="2011"
                value={form.year_from}
                onChange={(e) => setForm((f) => ({ ...f, year_from: e.target.value }))}
              />
              <Input
                label="Год по"
                type="number"
                placeholder="2017"
                value={form.year_to}
                onChange={(e) => setForm((f) => ({ ...f, year_to: e.target.value }))}
              />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Отмена</Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.name.trim()}
              className="flex-1"
            >
              Создать
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

function Panel({
  title, children, onAdd, addLabel, empty,
}: {
  title: string
  children?: React.ReactNode
  onAdd?: () => void
  addLabel?: string
  empty?: string
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
        <p className="text-sm font-medium text-text-primary truncate">{title}</p>
        {onAdd && (
          <button onClick={onAdd} className="text-accent hover:text-accent-hover p-1 rounded transition-colors flex-shrink-0">
            <Plus size={16} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto max-h-72">
        {empty ? (
          <p className="text-center text-text-muted text-sm py-8">{empty}</p>
        ) : (
          <div className="divide-y divide-border">{children}</div>
        )}
      </div>
    </div>
  )
}

function PanelItem({
  label, active, hasChildren, onClick,
}: {
  label: string
  active?: boolean
  hasChildren?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-bg-elevated ${
        active ? 'bg-accent-muted text-accent font-medium' : 'text-text-secondary'
      }`}
    >
      <span className="truncate">{label}</span>
      {hasChildren && <ChevronRight size={14} className="flex-shrink-0 opacity-50" />}
    </button>
  )
}
