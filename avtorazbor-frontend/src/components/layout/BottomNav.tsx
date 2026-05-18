import { NavLink } from 'react-router-dom'
import { Home, Grid3X3, Search, Heart, User } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/cn'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-xs transition-colors',
    isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
  )

export function BottomNav() {
  const user = useAuthStore((s) => s.user)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex bg-bg-surface border-t border-border md:hidden safe-area-inset-bottom">
      <NavLink to={ROUTES.HOME} end className={navClass}>
        <Home size={20} />
        <span>Главная</span>
      </NavLink>
      <NavLink to={ROUTES.CATALOG} className={navClass}>
        <Grid3X3 size={20} />
        <span>Каталог</span>
      </NavLink>
      <NavLink to={ROUTES.SEARCH} className={navClass}>
        <Search size={20} />
        <span>Поиск</span>
      </NavLink>
      <NavLink to={ROUTES.FAVORITES} className={navClass}>
        <Heart size={20} />
        <span>Избранное</span>
      </NavLink>
      <NavLink to={user ? ROUTES.PROFILE : ROUTES.LOGIN} className={navClass}>
        <User size={20} />
        <span>{user ? 'Профиль' : 'Войти'}</span>
      </NavLink>
    </nav>
  )
}
