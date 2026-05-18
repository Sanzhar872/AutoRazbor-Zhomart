import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ROUTES } from '@/constants/routes'

export function NotFoundPage() {
  return (
    <>
      <Helmet><title>404 — АвтоРазбор</title></Helmet>
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
        <p className="text-7xl font-bold text-accent opacity-60">404</p>
        <h1 className="text-xl font-semibold text-text-primary">Страница не найдена</h1>
        <p className="text-text-secondary text-sm">Возможно, ссылка устарела или была удалена</p>
        <Link
          to={ROUTES.HOME}
          className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
        >
          На главную
        </Link>
      </div>
    </>
  )
}
