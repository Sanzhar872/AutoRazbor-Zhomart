import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import App from '@/App'

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })))
const CatalogPage = lazy(() => import('@/pages/CatalogPage').then((m) => ({ default: m.CatalogPage })))
const PartPage = lazy(() => import('@/pages/PartPage').then((m) => ({ default: m.PartPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })))
const LoginPage = lazy(() => import('@/pages/AuthPage/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/AuthPage/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const PartsListPage = lazy(() => import('@/pages/admin/PartsListPage').then((m) => ({ default: m.PartsListPage })))
const PartFormPage = lazy(() => import('@/pages/admin/PartFormPage').then((m) => ({ default: m.PartFormPage })))
const StockPage = lazy(() => import('@/pages/admin/StockPage').then((m) => ({ default: m.StockPage })))
const CarsAdminPage = lazy(() => import('@/pages/admin/CarsAdminPage').then((m) => ({ default: m.CarsAdminPage })))
const CategoriesAdminPage = lazy(() => import('@/pages/admin/CategoriesAdminPage').then((m) => ({ default: m.CategoriesAdminPage })))

const Loader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <Spinner size="lg" />
  </div>
)

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to={`/login?next=${location.pathname}`} replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function S({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { index: true, element: <S><HomePage /></S> },
      { path: 'catalog', element: <S><CatalogPage /></S> },
      { path: 'catalog/:slug', element: <S><PartPage /></S> },
      { path: 'search', element: <S><SearchPage /></S> },
      { path: 'favorites', element: <S><RequireAuth><FavoritesPage /></RequireAuth></S> },
      { path: 'login', element: <S><LoginPage /></S> },
      { path: 'register', element: <S><RegisterPage /></S> },
      { path: 'profile', element: <S><RequireAuth><ProfilePage /></RequireAuth></S> },
      {
        path: 'admin',
        element: <S><RequireAdmin><AdminLayout /></RequireAdmin></S>,
        children: [
          { index: true, element: <S><DashboardPage /></S> },
          { path: 'parts', element: <S><PartsListPage /></S> },
          { path: 'parts/new', element: <S><PartFormPage /></S> },
          { path: 'parts/:id/edit', element: <S><PartFormPage /></S> },
          { path: 'stock', element: <S><StockPage /></S> },
          { path: 'cars', element: <S><CarsAdminPage /></S> },
          { path: 'categories', element: <S><CategoriesAdminPage /></S> },
        ],
      },
      { path: '*', element: <S><NotFoundPage /></S> },
    ],
  },
])
