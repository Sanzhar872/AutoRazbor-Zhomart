import { Link, useNavigate } from 'react-router-dom'
import { Search, Heart, User, Sun, Moon, Settings } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { useConfig } from '@/hooks/useConfig'
import { PhoneButton } from '@/components/phone/PhoneButton'
import { SearchBar } from '@/components/search/SearchBar'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const { theme, toggleTheme } = useThemeStore()
  const { data: config } = useConfig()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-bg-surface border-b border-border transition-theme">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-14">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2 flex-shrink-0">
            <span className="text-accent font-bold text-xl">АвтоРазбор</span>
          </Link>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <SearchBar />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Phone */}
            {config && (
              <div className="hidden lg:block">
                <PhoneButton phone={config.contact_phone} display={config.contact_phone_display} />
              </div>
            )}

            {/* Search — mobile icon */}
            <button
              onClick={() => navigate(ROUTES.SEARCH)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md"
            >
              <Search size={20} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Favorites */}
            {user && (
              <Link
                to={ROUTES.FAVORITES}
                className="p-2 text-text-secondary hover:text-accent transition-colors rounded-md"
              >
                <Heart size={20} />
              </Link>
            )}

            {/* User */}
            {user ? (
              <Link
                to={user.role === 'admin' ? ROUTES.ADMIN : ROUTES.PROFILE}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-md"
              >
                {user.role === 'admin' ? <Settings size={20} /> : <User size={20} />}
              </Link>
            ) : (
              <Link
                to={ROUTES.LOGIN}
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
