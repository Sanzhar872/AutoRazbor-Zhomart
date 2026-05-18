import { useQuery } from '@tanstack/react-query'
import { carsApi } from '@/api/cars.api'
import { queryKeys } from '@/constants/queryKeys'

export function useCarMakes() {
  return useQuery({ queryKey: queryKeys.cars, queryFn: carsApi.getMakes })
}

export function useCarModels(makeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.carModels(makeId ?? ''),
    queryFn: () => carsApi.getModels(makeId!),
    enabled: !!makeId,
  })
}

export function useCarGenerations(modelId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.carGenerations(modelId ?? ''),
    queryFn: () => carsApi.getGenerations(modelId!),
    enabled: !!modelId,
  })
}
