import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { Providers } from './providers'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BottomNav } from '@/components/layout/BottomNav'
import { TokenRefreshOnMount } from '@/components/auth/TokenRefreshOnMount'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'АвтоРазбор — Б/У запчасти в Алматы',
    template: '%s | АвтоРазбор',
  },
  description: 'Магазин б/у автозапчастей. Большой выбор, честные цены. Звоните!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = JSON.parse(localStorage.getItem('avtorazbor-theme') || '{}');
                document.documentElement.setAttribute('data-theme', t.state?.theme || 'dark');
              } catch(e) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <TokenRefreshOnMount />
          <div className="flex flex-col min-h-screen bg-bg-base text-text-primary transition-theme">
            <Header />
            <div className="flex-1">{children}</div>
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
              classNames: { toast: 'items-start gap-3' },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
