'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, BarChart3, Car, Grid3X3 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const links = [
  { to: ROUTES.ADMIN, icon: LayoutDashboard, label: 'Журнал', exact: true },
  { to: ROUTES.ADMIN_PARTS, icon: Package, label: 'Запчасти' },
  { to: ROUTES.ADMIN_STOCK, icon: BarChart3, label: 'Склад' },
  { to: ROUTES.ADMIN_CARS, icon: Car, label: 'Автомобили' },
  { to: ROUTES.ADMIN_CATEGORIES, icon: Grid3X3, label: 'Категории' },
]

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== 'admin') router.replace('/')
  }, [user, router])

  if (!user || user.role !== 'admin') return null

  const linkClass = (to: string, exact = false) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
      (exact ? pathname === to : pathname?.startsWith(to))
        ? 'bg-accent-muted text-accent font-medium'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
    )

  const mobileLinkClass = (to: string, exact = false) =>
    cn(
      'flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors',
      (exact ? pathname === to : pathname?.startsWith(to))
        ? 'border-accent text-accent'
        : 'border-transparent text-text-muted hover:text-text-secondary'
    )

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <aside className="w-52 flex-shrink-0 bg-bg-surface border-r border-border hidden md:flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Администрация</p>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {links.map(({ to, icon: Icon, label, exact }) => (
            <Link key={to} href={to} className={linkClass(to, exact)}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-bg-surface border-b border-border flex overflow-x-auto">
        {links.map(({ to, icon: Icon, label, exact }) => (
          <Link key={to} href={to} className={mobileLinkClass(to, exact)}>
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </div>

      <main className="flex-1 p-4 sm:p-6 mt-0 md:mt-0 pt-12 md:pt-4 overflow-auto">
        {children}
      </main>
    </div>
  )
}
