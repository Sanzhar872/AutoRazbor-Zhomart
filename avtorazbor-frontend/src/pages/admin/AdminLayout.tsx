import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Package, BarChart3, Car, Grid3X3 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/cn'

const links = [
  { to: ROUTES.ADMIN, icon: LayoutDashboard, label: 'Журнал', end: true },
  { to: ROUTES.ADMIN_PARTS, icon: Package, label: 'Запчасти' },
  { to: ROUTES.ADMIN_STOCK, icon: BarChart3, label: 'Склад' },
  { to: ROUTES.ADMIN_CARS, icon: Car, label: 'Автомобили' },
  { to: ROUTES.ADMIN_CATEGORIES, icon: Grid3X3, label: 'Категории' },
]

export function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-bg-surface border-r border-border hidden md:flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Администрация</p>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-accent-muted text-accent font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-bg-surface border-b border-border flex overflow-x-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              )
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>

      <main className="flex-1 p-4 sm:p-6 mt-0 md:mt-0 pt-12 md:pt-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
