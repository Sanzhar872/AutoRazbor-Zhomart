import { Link } from 'react-router-dom'
import { Phone, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useConfig } from '@/hooks/useConfig'
import { DrivingCar3D } from './DrivingCar3D'

export function HeroBanner() {
  const { data: config } = useConfig()

  return (
    <section className="relative min-h-[420px] md:min-h-[520px] flex items-center overflow-hidden rounded-xl bg-bg-surface border border-border">
      {/* 3D driving car scene */}
      <DrivingCar3D />

      {/* Gradient overlay — left side opaque for text, right side transparent for car */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg-base/95 via-bg-base/75 to-transparent" />

      <div className="relative z-10 px-6 md:px-12 py-12 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-muted border border-accent/30 rounded-full text-accent text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          Б/У запчасти в наличии
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-text-primary leading-tight mb-4">
          Запчасти для вашего<br />
          <span className="text-accent">автомобиля</span>
        </h1>

        <p className="text-text-secondary text-base md:text-lg mb-8 max-w-md">
          Тысячи б/у запчастей с проверкой состояния. Звоните — найдём нужное.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={ROUTES.CATALOG}
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
        </div>
      </div>
    </section>
  )
}
