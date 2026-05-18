import { useQuery } from '@tanstack/react-query'
import { configApi } from '@/api/config.api'
import { queryKeys } from '@/constants/queryKeys'

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: configApi.get,
    staleTime: 1000 * 60 * 60,
  })
}
