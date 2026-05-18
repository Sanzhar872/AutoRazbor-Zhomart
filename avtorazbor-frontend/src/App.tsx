import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { HelmetProvider } from 'react-helmet-async'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth.api'

function TokenRefreshOnMount() {
  const { refreshToken, accessToken, clearAuth } = useAuthStore()
  const qc = useQueryClient()

  useEffect(() => {
    if (refreshToken && !accessToken) {
      authApi
        .refresh(refreshToken)
        .then(({ access_token, refresh_token }) => {
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token,
            refresh_token,
          )
          // After token refresh, invalidate part queries so they reload with auth
          qc.invalidateQueries({ queryKey: ['parts'] })
        })
        .catch(() => {
          clearAuth()
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function App() {
  return (
    <HelmetProvider>
      <TokenRefreshOnMount />
      <div className="flex flex-col min-h-screen bg-bg-base text-text-primary transition-theme">
        <Header />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
        <BottomNav />
      </div>
      <Toaster
        position="bottom-center"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          duration: 3500,
          style: {
            fontSize: '15px',
            padding: '14px 18px',
            borderRadius: '10px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          },
          classNames: {
            toast: 'items-start gap-3',
          },
        }}
      />
    </HelmetProvider>
  )
}
