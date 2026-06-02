'use client'

import { useEffect, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useThemeStore } from '@/store/theme.store'

function ThemeInitializer() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      {children}
    </QueryClientProvider>
  )
}
