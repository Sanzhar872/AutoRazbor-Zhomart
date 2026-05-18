import { useState, useRef } from 'react'
import { Upload, X, Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { mediaApi, type UploadedAsset } from '@/api/media.api'
import { cn } from '@/lib/cn'

export interface PartImageItem {
  id?: string
  assetId: string
  publicUrl: string
  position: number
  isPrimary: boolean
}

interface ImageUploadZoneProps {
  partId?: string
  images: PartImageItem[]
  onChange: (images: PartImageItem[]) => void
  maxImages?: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? 'http://localhost:5000'

export function ImageUploadZone({
  partId,
  images,
  onChange,
  maxImages = 10,
}: ImageUploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const remaining = maxImages - images.length
    const toUpload = Array.from(files).slice(0, remaining)

    if (toUpload.length === 0) {
      toast.error(`Максимум ${maxImages} фотографий`)
      return
    }

    setUploading(true)
    const uploaded: PartImageItem[] = []

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} — не изображение`)
        continue
      }
      try {
        const asset: UploadedAsset = await mediaApi.upload(file)
        const isPrimary = images.length === 0 && uploaded.length === 0
        const position = images.length + uploaded.length

        // if partId already exists — attach to part immediately
        if (partId) {
          const img = await mediaApi.addImageToPart(partId, asset.id, position, isPrimary)
          uploaded.push({ id: img.id, assetId: asset.id, publicUrl: asset.public_url, position, isPrimary })
        } else {
          uploaded.push({ assetId: asset.id, publicUrl: asset.public_url, position, isPrimary })
        }
      } catch {
        toast.error(`Ошибка загрузки ${file.name}`)
      }
    }

    setUploading(false)
    if (uploaded.length > 0) {
      onChange([...images, ...uploaded])
      toast.success(`Загружено ${uploaded.length} фото`)
    }
  }

  const setAsPrimary = (assetId: string) => {
    onChange(images.map((img) => ({ ...img, isPrimary: img.assetId === assetId })))
  }

  const remove = async (item: PartImageItem) => {
    if (partId && item.id) {
      try {
        await mediaApi.removeImageFromPart(partId, item.id)
      } catch {
        toast.error('Ошибка удаления')
        return
      }
    }
    const updated = images
      .filter((img) => img.assetId !== item.assetId)
      .map((img, i) => ({ ...img, position: i, isPrimary: i === 0 ? true : img.isPrimary && img.assetId !== item.assetId }))
    onChange(updated)
  }

  const resolveUrl = (url: string) =>
    url.startsWith('http') ? url : `${API_BASE}${url}`

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-text-secondary">
        Фотографии ({images.length}/{maxImages})
      </label>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors',
          dragOver
            ? 'border-accent bg-accent-muted'
            : 'border-border hover:border-accent/50 hover:bg-bg-elevated',
          images.length >= maxImages && 'opacity-50 pointer-events-none'
        )}
      >
        {uploading ? (
          <Loader2 size={24} className="text-accent animate-spin" />
        ) : (
          <Upload size={24} className="text-text-muted" />
        )}
        <p className="text-sm text-text-secondary">
          {uploading ? 'Загрузка...' : 'Нажмите или перетащите файлы'}
        </p>
        <p className="text-xs text-text-muted">JPG, PNG, WebP — до 10 МБ каждый</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {images.map((img) => (
            <div
              key={img.assetId}
              className={cn(
                'relative group aspect-square rounded-md overflow-hidden border',
                img.isPrimary ? 'border-accent ring-1 ring-accent' : 'border-border'
              )}
            >
              <img
                src={resolveUrl(img.publicUrl)}
                alt=""
                className="w-full h-full object-cover"
              />

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAsPrimary(img.assetId)}
                  title="Сделать главным"
                  className={cn(
                    'p-1.5 rounded-full transition-colors',
                    img.isPrimary
                      ? 'bg-accent text-white'
                      : 'bg-white/20 text-white hover:bg-accent'
                  )}
                >
                  <Star size={14} fill={img.isPrimary ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(img)}
                  className="p-1.5 rounded-full bg-white/20 text-white hover:bg-danger transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {img.isPrimary && (
                <div className="absolute bottom-0 left-0 right-0 bg-accent/80 text-white text-[10px] text-center py-0.5">
                  Главное
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
