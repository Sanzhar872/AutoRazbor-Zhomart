'use client'

import { Phone, MessageCircle } from 'lucide-react'
import { useConfig } from '@/hooks/useConfig'

export function CallToAction() {
  const { data: config } = useConfig()
  if (!config) return null

  return (
    <section className="bg-accent/10 border border-accent/25 rounded-xl p-8 text-center">
      <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
        Не нашли нужную запчасть?
      </h2>
      <p className="text-text-secondary mb-6">
        Позвоните — поможем подобрать и сообщим о наличии
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={`tel:${config.contact_phone}`}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-hover text-white rounded-md font-semibold text-lg transition-all active:scale-[0.98]"
        >
          <Phone size={20} />
          {config.contact_phone_display}
        </a>

        <a
          href={config.whatsapp_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-bg-surface border border-border hover:border-success text-text-primary hover:text-success rounded-md font-medium transition-all"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
      </div>

      <p className="text-text-muted text-sm mt-4">{config.working_hours}</p>
    </section>
  )
}
