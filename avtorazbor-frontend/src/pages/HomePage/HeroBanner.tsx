import { Link } from 'react-router-dom'
import { Phone, ArrowRight, MapPin, ExternalLink, Clock } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useConfig } from '@/hooks/useConfig'

const TWOGIS_URL = 'https://2gis.kz/almaty/geo/70000001047219954'

export function HeroBanner() {
  const { data: config } = useConfig()

  return (
    <section className="rounded-xl bg-bg-surface border border-border overflow-hidden">
      <div className="grid md:grid-cols-2 min-h-[420px] md:min-h-[480px]">

        {/* Left — text */}
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

        {/* Right — address card */}
        <div className="flex items-center justify-center bg-bg-elevated border-l border-border px-6 py-10">
          <div className="w-full max-w-sm flex flex-col gap-5">

            {/* Map pin icon block */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <MapPin size={28} className="text-accent" />
              </div>
            </div>

            <div className="text-center flex flex-col gap-1">
              <p className="text-xs text-text-muted uppercase tracking-widest">Наш адрес</p>
              <p className="text-lg font-semibold text-text-primary leading-snug">
                г. Алматы,<br />проспект Райымбека 550
              </p>
            </div>

            {config && (
              <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                <Clock size={14} className="text-text-muted flex-shrink-0" />
                {config.working_hours}
              </div>
            )}

            <a
              href={TWOGIS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-lg border border-accent/40 text-accent text-sm font-medium hover:bg-accent hover:text-white transition-all"
            >
              <MapPin size={15} />
              Открыть на карте 2GIS
              <ExternalLink size={13} />
            </a>

          </div>
        </div>

      </div>
    </section>
  )
}
