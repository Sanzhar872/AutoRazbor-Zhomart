'use client'

import { useState } from 'react'
import { Heart, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/auth.store'
import { useToggleFavorite } from '@/hooks/useFavorites'
import { ROUTES } from '@/constants/routes'
import type { FavoriteMeta } from '@/types/api'

interface FavoriteButtonProps {
  partId: string
  partSlug: string
  meta: FavoriteMeta
}

export function FavoriteButton({ partId, partSlug, meta }: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const { mutate, isPending } = useToggleFavorite(partSlug)
  const [pulse, setPulse] = useState(false)

  const { is_favorited_by_me, available_slots, max_slots } = meta

  if (!user) {
    return (
      <button
        onClick={() => router.push(`${ROUTES.LOGIN}?next=/catalog/${partSlug}`)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium border border-border bg-bg-elevated text-text-secondary hover:border-accent hover:text-accent transition-all"
      >
        <LogIn size={17} />
        Войдите, чтобы добавить в избранное
      </button>
    )
  }

  if (max_slots === 0) {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-bg-elevated text-text-muted text-sm cursor-not-allowed border border-border">
        <Heart size={17} />
        Нет в наличии
      </button>
    )
  }

  if (!is_favorited_by_me && available_slots === 0) {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-bg-elevated text-text-muted text-sm cursor-not-allowed border border-border">
        <Heart size={17} />
        Все места заняты
      </button>
    )
  }

  const handleClick = () => {
    setPulse(true)
    setTimeout(() => setPulse(false), 350)
    mutate({ partId, isFav: is_favorited_by_me })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all border',
        'disabled:cursor-not-allowed disabled:opacity-70',
        is_favorited_by_me
          ? 'bg-accent-muted border-accent/40 text-accent hover:bg-accent hover:text-white'
          : 'bg-bg-elevated border-border text-text-primary hover:border-accent hover:text-accent'
      )}
    >
      <Heart
        size={17}
        className={cn('transition-all', pulse && 'animate-heart')}
        fill={is_favorited_by_me ? 'currentColor' : 'none'}
      />
      {isPending ? 'Обработка...' : is_favorited_by_me ? 'В избранном' : 'В избранное'}
    </button>
  )
}
