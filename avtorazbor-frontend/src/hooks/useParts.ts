import { useQuery } from '@tanstack/react-query'
import { partsApi } from '@/api/parts.api'
import { queryKeys } from '@/constants/queryKeys'
import type { PartFilters } from '@/types/part'

export function useParts(filters?: PartFilters) {
  return useQuery({
    queryKey: queryKeys.parts(filters),
    queryFn: () => partsApi.list(filters),
  })
}

export function usePart(slug: string) {
  return useQuery({
    queryKey: queryKeys.part(slug),
    queryFn: () => partsApi.getBySlug(slug),
    enabled: !!slug,
  })
}
