'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { partsApi } from '@/api/parts.api'
import { mediaApi } from '@/api/media.api'
import { getApiError } from '@/api/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useCategories } from '@/hooks/useCategories'
import { useConfig } from '@/hooks/useConfig'
import { ROUTES } from '@/constants/routes'
import { ImageUploadZone, type PartImageItem } from './ImageUploadZone'

const schema = z.object({
  title: z.string().min(1, 'Обязательное поле'),
  category_id: z.string().min(1, 'Выберите категорию'),
  price_kzt: z.coerce.number({ invalid_type_error: 'Введите цену' }).min(0, 'Введите цену'),
  stock: z.coerce.number().min(0).default(0),
  condition: z.enum(['good', 'fair', 'poor']).default('good'),
  status: z.enum(['active', 'draft', 'sold_out', 'archived']).default('active'),
  priority: z.coerce.number().int().min(1).max(4).default(2),
  description: z.string().optional(),
  oem_number: z.string().optional(),
  sku: z.string().optional(),
  contact_phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  id?: string
}

export function PartFormPageClient({ id: slug }: Props) {
  const isEdit = !!slug
  const router = useRouter()
  const qc = useQueryClient()
  const { data: categories } = useCategories()
  const { data: config } = useConfig()
  const [images, setImages] = useState<PartImageItem[]>([])
  const [partId, setPartId] = useState<string | null>(null)

  const { data: existingPart } = useQuery({
    queryKey: ['parts', 'edit', slug],
    queryFn: () => partsApi.getBySlug(slug!),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { stock: 0, condition: 'good', status: 'active' },
  })

  useEffect(() => {
    if (existingPart) {
      setPartId(existingPart.id)
      reset({
        title: existingPart.title,
        category_id: existingPart.category.id,
        price_kzt: existingPart.price_kzt,
        stock: existingPart.stock,
        condition: existingPart.condition as FormData['condition'],
        status: existingPart.status as FormData['status'],
        priority: existingPart.priority ?? 2,
        description: existingPart.description ?? '',
        oem_number: existingPart.oem_number ?? '',
        sku: existingPart.sku ?? '',
        contact_phone: existingPart.contact_phone ?? '',
      })
      setImages(
        existingPart.images.map((img) => ({
          id: img.id,
          assetId: img.id,
          publicUrl: img.public_url,
          position: img.position,
          isPrimary: img.is_primary,
        }))
      )
    }
  }, [existingPart, reset])

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEdit) return partsApi.update(partId!, data)
      const part = await partsApi.create(data)
      for (let i = 0; i < images.length; i++) {
        await mediaApi.addImageToPart(part.id, images[i].assetId, i, i === 0)
      }
      return part
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Запчасть обновлена' : 'Запчасть создана')
      qc.invalidateQueries({ queryKey: ['parts'] })
      router.push(ROUTES.ADMIN_PARTS)
    },
    onError: (e) => toast.error(getApiError(e)),
  })

  const sel =
    'w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-border-focus transition-colors'

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">
        {isEdit ? 'Редактировать запчасть' : 'Новая запчасть'}
      </h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-5">
        <Input
          label="Название *"
          placeholder="Фара левая Toyota Camry V50"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Категория *</label>
          <select {...register('category_id')} className={sel}>
            <option value="">Выберите категорию</option>
            {categories?.flatMap((c) => [
              <option key={c.id} value={c.id} disabled style={{ fontWeight: 600 }}>{c.name}</option>,
              ...(c.children ?? []).map((sub) => (
                <option key={sub.id} value={sub.id}>{'   — '}{sub.name}</option>
              )),
            ])}
          </select>
          {errors.category_id && <p className="text-xs text-danger">{errors.category_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Цена (₸) *</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="25 000"
              value={watch('price_kzt') ? Number(watch('price_kzt')).toLocaleString('ru-RU') : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\s/g, '').replace(/[^\d]/g, '')
                setValue('price_kzt', raw ? Number(raw) : 0, { shouldValidate: true })
              }}
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-colors"
            />
            {errors.price_kzt && <p className="text-xs text-danger">{errors.price_kzt.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Количество</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={watch('stock') ? Number(watch('stock')).toLocaleString('ru-RU') : ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\s/g, '').replace(/[^\d]/g, '')
                setValue('stock', raw ? Number(raw) : 0, { shouldValidate: true })
              }}
              className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus/30 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Состояние</label>
            <select {...register('condition')} className={sel}>
              <option value="good">Хорошее</option>
              <option value="fair">Удовлетворительное</option>
              <option value="poor">Плохое</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Статус</label>
            <select {...register('status')} className={sel}>
              <option value="draft">Черновик</option>
              <option value="active">Активна</option>
              <option value="sold_out">Нет в наличии</option>
              <option value="archived">Архив</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Приоритет показа</label>
          <select {...register('priority')} className={sel}>
            <option value={4}>⭐ Главная страница (высший)</option>
            <option value={3}>🔼 Высокий</option>
            <option value={2}>▶ Средний (по умолчанию)</option>
            <option value={1}>🔽 Низкий</option>
          </select>
          <p className="text-xs text-text-muted">Товары с приоритетом «Главная» показываются в «Новых поступлениях»</p>
        </div>

        <Input label="OEM номер" placeholder="81150-06430" {...register('oem_number')} />
        <Input label="Артикул (SKU)" placeholder="SKU-001" {...register('sku')} />

        {config && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Контактный номер для этой запчасти</label>
            <div className="flex flex-col gap-2 bg-bg-input border border-border rounded-md px-3 py-2.5">
              {[
                { value: config.contact_phone, label: config.contact_phone_display },
                { value: config.contact_phone_2, label: config.contact_phone_display_2 },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                  <input
                    type="radio"
                    value={value}
                    {...register('contact_phone')}
                    className="accent-[var(--color-accent)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-secondary">Описание</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Дополнительная информация..."
            className="w-full bg-bg-input border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors resize-y"
          />
        </div>

        <div className="border-t border-border pt-4">
          <ImageUploadZone
            partId={isEdit ? partId ?? undefined : undefined}
            images={images}
            onChange={setImages}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(ROUTES.ADMIN_PARTS)}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending} className="flex-1">
            {isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </div>
  )
}
