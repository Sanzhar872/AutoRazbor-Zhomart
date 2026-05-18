import { client } from './client'
import type { CarMake, CarModel, CarGeneration } from '@/types/car'

export const carsApi = {
  getMakes: () => client.get<CarMake[]>('/cars/makes').then((r) => r.data),
  getModels: (makeId: string) =>
    client.get<CarModel[]>(`/cars/makes/${makeId}/models`).then((r) => r.data),
  getGenerations: (modelId: string) =>
    client.get<CarGeneration[]>(`/cars/models/${modelId}/generations`).then((r) => r.data),
}
