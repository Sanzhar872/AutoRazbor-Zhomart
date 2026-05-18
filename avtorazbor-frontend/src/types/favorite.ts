import type { PartListItem } from './part'

export interface Favorite {
  id: string
  part: PartListItem
  created_at: string
}
