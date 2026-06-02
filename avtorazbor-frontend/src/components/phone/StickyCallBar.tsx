'use client'

import { Phone } from 'lucide-react'
import { useConfig } from '@/hooks/useConfig'

export function StickyCallBar() {
  const { data: config } = useConfig()
  if (!config) return null

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 flex md:hidden">
      <a
        href={`tel:${config.contact_phone}`}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-accent text-white text-sm font-semibold shadow-card"
      >
        <Phone size={18} />
        Позвонить: {config.contact_phone_display}
      </a>
    </div>
  )
}
