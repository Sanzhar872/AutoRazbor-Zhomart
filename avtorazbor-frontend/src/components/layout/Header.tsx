'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, User, Sun, Moon, Settings } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { useConfig } from '@/hooks/useConfig'
import { PhoneButton } from '@/components/phone/PhoneButton'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const { theme, toggleTheme } = useThemeStore()
  const { data: config } = useConfig()
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  return (
    <header className="sticky top-0 z-40 bg-bg-surface border-b border-border transition-theme">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-14">
          <Link href={ROUTES.HOME} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-accent font-bold text-xl">АвтоРазбор</span>
          </Link>

          <div className="flex items-center gap-1 ml-auto">
            {config && !isAdmin && (
              <div className="hidden lg:block">
                <PhoneButton phone={config.contact_phone} display={config.contact_phone_display} />
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user && (
              <Link
                href={ROUTES.FAVORITES}
                className="p-2 text-text-secondary hover:text-accent transition-colors rounded-md"
              >
                <Heart size={20} />
              </Link>
            )}

            {user ? (
              <Link
                href={user.role === 'admin' ? ROUTES.ADMIN : ROUTES.PROFILE}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md"
              >
                {user.role === 'admin' ? <Settings size={20} /> : <User size={20} />}
              </Link>
            ) : (
              <Link
                href={ROUTES.LOGIN}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-primary bg-bg-elevated border border-border rounded-md hover:border-border-focus hover:text-accent transition-all"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
