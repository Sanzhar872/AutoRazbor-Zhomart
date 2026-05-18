import { cn } from '@/lib/cn'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-success/15 text-success border-success/25',
  warning: 'bg-warning/15 text-warning border-warning/25',
  danger:  'bg-danger/15 text-danger border-danger/25',
  neutral: 'bg-bg-elevated text-text-secondary border-border',
  accent:  'bg-accent-muted text-accent border-accent/25',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
