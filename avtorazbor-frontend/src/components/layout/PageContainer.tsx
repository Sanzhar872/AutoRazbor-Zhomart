import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn('max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6', className)}>
      {children}
    </main>
  )
}
