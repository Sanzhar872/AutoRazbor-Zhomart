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
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-md font-medium text-sm transition-all active:scale-[0.98] whitespace-nowrap"
            >
              Смотреть каталог
              <ArrowRight size={16} />
            </Link>

            <a
              href="tel:87759353595"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-bg-elevated hover:bg-border border border-border rounded-md font-medium text-sm transition-all whitespace-nowrap"
            >
              <Phone size={15} className="text-accent flex-shrink-0" />
              8 775 935 3595
            </a>

            <a
              href="https://go.2gis.com/OGnqE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-sm text-white whitespace-nowrap transition-all duration-200 active:scale-[0.96] hover:scale-105 hover:shadow-lg hover:brightness-110"
              style={{ backgroundColor: '#A6CE38' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="11" r="8" stroke="white" strokeWidth="2"/>
                <circle cx="12" cy="11" r="3.5" fill="white"/>
                <path d="M12 19l-1.5 3h3L12 19z" fill="white"/>
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
