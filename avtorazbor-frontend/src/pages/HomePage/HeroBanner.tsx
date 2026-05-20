import { Link } from 'react-router-dom'
import { Phone, ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useConfig } from '@/hooks/useConfig'

const GMAPS_EMBED =
  'https://maps.google.com/maps?q=%D0%BF%D1%80%D0%BE%D1%81%D0%BF%D0%B5%D0%BA%D1%82+%D0%A0%D0%B0%D0%B9%D1%8B%D0%BC%D0%B1%D0%B5%D0%BA%D0%B0+550+%D0%90%D0%BB%D0%BC%D0%B0%D1%82%D1%8B+%D0%9A%D0%B0%D0%B7%D0%B0%D1%85%D1%81%D1%82%D0%B0%D0%BD&output=embed&z=16&hl=ru'

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

        {/* Right — Google Maps */}
        <div className="relative min-h-[280px] md:min-h-0">
          <iframe
            src={GMAPS_EMBED}
            title="Наш адрес на карте"
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>

      </div>
    </section>
  )
}
