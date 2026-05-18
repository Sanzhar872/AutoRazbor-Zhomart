import { Phone } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PhoneButtonProps {
  phone: string
  display: string
  className?: string
}

export function PhoneButton({ phone, display, className }: PhoneButtonProps) {
  return (
    <a
      href={`tel:${phone}`}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium',
        'bg-accent/10 text-accent border border-accent/25 hover:bg-accent hover:text-white transition-all',
        className
      )}
    >
      <Phone size={15} />
      {display}
    </a>
  )
}
