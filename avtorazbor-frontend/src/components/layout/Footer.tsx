'use client'

import Link from 'next/link'
import { Phone, MapPin, Clock } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useConfig } from '@/hooks/useConfig'

export function Footer() {
  const { data: config } = useConfig()

  return (
    <footer className="bg-bg-surface border-t border-border mt-auto transition-theme">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <span className="text-accent font-bold text-lg">АвтоРазбор</span>
            <p className="mt-2 text-sm text-text-secondary">
              Б/У автозапчасти в наличии. Большой выбор, честные цены.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-text-primary text-sm">Навигация</p>
            <nav className="flex flex-col gap-1.5">
              <Link href={ROUTES.CATALOG} className="text-sm text-text-secondary hover:text-accent transition-colors">Каталог</Link>
              <Link href={ROUTES.SEARCH} className="text-sm text-text-secondary hover:text-accent transition-colors">Поиск</Link>
              <Link href={ROUTES.FAVORITES} className="text-sm text-text-secondary hover:text-accent transition-colors">Избранное</Link>
            </nav>
          </div>

          {config && (
            <div className="space-y-3">
              <p className="font-medium text-text-primary text-sm">Контакты</p>
              <div className="space-y-2">
                <a
                  href={`tel:${config.contact_phone}`}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  <Phone size={14} />
                  {config.contact_phone_display}
                </a>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock size={14} />
                  {config.working_hours}
                </p>
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin size={14} />
                  {config.address}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-text-muted">
          © {new Date().getFullYear()} АвтоРазбор
        </div>
      </div>
    </footer>
  )
}
