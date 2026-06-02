'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export function NotFoundPageClient() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-4">
      <p className="text-7xl font-bold text-accent opacity-60">404</p>
      <h1 className="text-xl font-semibold text-text-primary">Страница не найдена</h1>
      <p className="text-text-secondary text-sm">Возможно, ссылка устарела или была удалена</p>
      <Link
        href={ROUTES.HOME}
        className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-md text-sm font-medium transition-colors"
      >
        На главную
      </Link>
    </div>
  )
}
