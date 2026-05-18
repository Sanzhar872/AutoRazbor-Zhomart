import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import axios from 'axios'
import { favoritesApi } from '@/api/favorites.api'
import { queryKeys } from '@/constants/queryKeys'
import { getApiError } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import type { Part } from '@/types/part'

export function useFavorites() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: queryKeys.favorites,
    queryFn: favoritesApi.list,
    enabled: !!user,
  })
}

export function useToggleFavorite(slug: string) {
  const qc = useQueryClient()

  return useMutation({
    // isFav is passed explicitly from the button — don't read from stale cache
    mutationFn: async ({ partId, isFav }: { partId: string; isFav: boolean }) => {
      if (isFav) {
        await favoritesApi.remove(partId)
        return { action: 'removed' as const }
      } else {
        await favoritesApi.add(partId)
        return { action: 'added' as const }
      }
    },
    onMutate: async ({ isFav }) => {
      await qc.cancelQueries({ queryKey: queryKeys.part(slug) })
      const prev = qc.getQueryData<Part>(queryKeys.part(slug))
      qc.setQueryData<Part>(queryKeys.part(slug), (old) => {
        if (!old?.favorite_meta) return old
        return {
          ...old,
          favorite_meta: {
            ...old.favorite_meta,
            is_favorited_by_me: !isFav,
            used_slots: isFav ? old.favorite_meta.used_slots - 1 : old.favorite_meta.used_slots + 1,
            available_slots: isFav
              ? old.favorite_meta.available_slots + 1
              : old.favorite_meta.available_slots - 1,
          },
        }
      })
      return { prev }
    },
    onSuccess: (result) => {
      toast.success(result.action === 'added' ? 'Добавлено в избранное' : 'Удалено из избранного')
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.part(slug), ctx.prev)
      toast.error(getApiError(err))
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.part(slug) })
      qc.invalidateQueries({ queryKey: queryKeys.favorites })
    },
  })
}
