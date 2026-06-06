import { client } from './client'
import type { Part, PartListItem, PartFilters } from '@/types/part'
import type { PaginatedResponse } from '@/types/api'

export const partsApi = {
  list: (filters?: PartFilters) =>
    client
      .get<PaginatedResponse<PartListItem>>('/parts', { params: filters })
      .then((r) => r.data),

  getBySlug: (slug: string) =>
    client.get<Part>(`/parts/${slug}`).then((r) => r.data),

  create: (data: Partial<Part> & { generation_ids?: string[] }) =>
    client.post<Part>('/parts', data).then((r) => r.data),

  update: (id: string, data: Partial<Part> & { generation_ids?: string[] }) =>
    client.patch<Part>(`/parts/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/parts/${id}`),

  deleteAll: () =>
    client.delete('/parts/'),
}
