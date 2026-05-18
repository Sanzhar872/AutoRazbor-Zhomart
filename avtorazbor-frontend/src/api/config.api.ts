import { client } from './client'
import type { SiteConfig } from '@/types/api'

export const configApi = {
  get: () => client.get<SiteConfig>('/config').then((r) => r.data),
}
