'use client'

import Link from 'next/link'
import { Phone, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useConfig } from '@/hooks/useConfig'
import { DGisMap } from '@/components/map/DGisMap'


export function HeroBanner() {
  const { data: config } = useConfig()

  return (
    <section className="rounded-xl bg-bg-surface border border-border overflow-hidden">
      <div className="grid md:grid-cols-2 min-h-[420px] md:min-h-[480px]">
        <div className="flex flex-col justify-center px-6 md:px-12 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-muted border border-accent/30 rounded-full text-accent text-xs font-medium mb-4 w-fit">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
            Б/У запчасти в наличии
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight mb-4">
            Запчасти для вашего<br />
            <span className="text-accent">автомобиля</span>
          </h1>

          <p className="text-text-secondary text-base mb-8 max-w-md">
            Тысячи б/у запчастей с проверкой состояния. Звоните — найдём нужное.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={ROUTES.CATALOG}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-sm transition-all active:scale-[0.98]"
            >
              Смотреть каталог
              <ArrowRight size={16} />
            </Link>

            {config && (
              <a
                href={`tel:${config.contact_phone}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-bg-elevated hover:bg-border text-text-primary border border-border rounded-md font-medium text-sm transition-all"
              >
                <Phone size={16} className="text-accent" />
                {config.contact_phone_display}
              </a>
            )}

            <a
              href="https://go.2gis.com/OGnqE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-bg-elevated hover:bg-border text-text-primary border border-border rounded-md font-medium text-sm transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#1DB954" fillOpacity="0"/>
                <text x="0" y="0" fontSize="0">2GIS</text>
                <path d="M16 3C9.373 3 4 8.373 4 15c0 4.418 2.317 8.292 5.785 10.51L16 29l6.215-3.49A11.966 11.966 0 0028 15c0-6.627-5.373-12-12-12z" fill="#1BAD5C"/>
                <circle cx="16" cy="15" r="5" fill="white"/>
              </svg>
              Мы в 2ГИС
            </a>
          </div>
        </div>

        <div className="relative min-h-[280px] md:min-h-0">
          <DGisMap />
        </div>
      </div>
    </section>
  )
}
