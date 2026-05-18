import { client } from './client'
import type { Favorite } from '@/types/favorite'

export const favoritesApi = {
  list: () => client.get<Favorite[]>('/favorites').then((r) => r.data),
  add: (part_id: string) =>
    client.post<Favorite>('/favorites', { part_id }).then((r) => r.data),
  remove: (part_id: string) =>
    client.delete(`/favorites/${part_id}`),
}
