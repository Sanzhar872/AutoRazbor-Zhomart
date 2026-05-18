import type { PartFilters } from '@/types/part'

export const queryKeys = {
  parts:          (filters?: PartFilters) => ['parts', filters] as const,
  part:           (slug: string)          => ['parts', slug] as const,
  search:         (q: string)             => ['parts', 'search', q] as const,
  favorites:                                 ['favorites'] as const,
  cars:                                      ['cars'] as const,
  carModels:      (makeId: string)        => ['cars', 'models', makeId] as const,
  carGenerations: (modelId: string)       => ['cars', 'generations', modelId] as const,
  categories:                                ['categories'] as const,
  config:                                    ['config'] as const,
  adminStock:                                ['admin', 'stock'] as const,
  adminDashboard:                            ['admin', 'dashboard'] as const,
}
