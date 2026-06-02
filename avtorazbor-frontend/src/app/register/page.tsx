import type { Metadata } from 'next'
import { RegisterPageClient } from '@/views/AuthPage/RegisterPage'

export const metadata: Metadata = { title: 'Регистрация' }

export default function RegisterPage() {
  return <RegisterPageClient />
}
