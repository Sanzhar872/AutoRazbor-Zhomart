import { client } from './client'
import type { Category } from '@/types/category'

export const categoriesApi = {
  list: () => client.get<Category[]>('/categories').then((r) => r.data),
}
