import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginPageClient } from '@/views/AuthPage/LoginPage'

export const metadata: Metadata = { title: 'Войти' }

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageClient />
    </Suspense>
  )
}
