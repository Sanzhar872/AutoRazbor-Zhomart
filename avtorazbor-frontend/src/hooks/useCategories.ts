import { useQuery } from '@tanstack/react-query'
import { categoriesApi } from '@/api/categories.api'
import { queryKeys } from '@/constants/queryKeys'

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list })
}
