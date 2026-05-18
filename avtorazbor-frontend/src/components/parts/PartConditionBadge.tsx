import { Badge } from '@/components/ui/Badge'
import { S } from '@/constants/strings.ru'
import type { PartCondition } from '@/types/part'

const map: Record<PartCondition, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  good: { label: S.conditionGood, variant: 'success' },
  fair: { label: S.conditionFair, variant: 'warning' },
  poor: { label: S.conditionPoor, variant: 'danger' },
}

export function PartConditionBadge({ condition }: { condition: PartCondition }) {
  const { label, variant } = map[condition]
  return <Badge variant={variant}>{label}</Badge>
}
