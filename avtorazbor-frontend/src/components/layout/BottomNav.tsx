'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, Search, Heart, User } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/cn'

export function BottomNav() {
  const user = useAuthStore((s) => s.user)
  const pathname = usePathname()

  const navClass = (href: string, exact = false) =>
    cn(
      'flex flex-col items-center gap-0.5 py-2 px-3 flex-1 text-xs transition-colors',
      (exact ? pathname === href : pathname?.startsWith(href))
        ? 'text-accent'
        : 'text-text-muted hover:text-text-secondary'
    )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex bg-bg-surface border-t border-border md:hidden safe-area-inset-bottom">
      <Link href={ROUTES.HOME} className={navClass(ROUTES.HOME, true)}>
        <Home size={20} />
        <span>Главная</span>
      </Link>
      <Link href={ROUTES.CATALOG} className={navClass(ROUTES.CATALOG)}>
        <Grid3X3 size={20} />
        <span>Каталог</span>
      </Link>
      <Link href={ROUTES.SEARCH} className={navClass(ROUTES.SEARCH)}>
        <Search size={20} />
        <span>Поиск</span>
      </Link>
      <Link href={ROUTES.FAVORITES} className={navClass(ROUTES.FAVORITES)}>
        <Heart size={20} />
        <span>Избранное</span>
      </Link>
      <Link href={user ? ROUTES.PROFILE : ROUTES.LOGIN} className={navClass(user ? ROUTES.PROFILE : ROUTES.LOGIN)}>
        <User size={20} />
        <span>{user ? 'Профиль' : 'Войти'}</span>
      </Link>
    </nav>
  )
}
