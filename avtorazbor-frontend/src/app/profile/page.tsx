import type { Metadata } from 'next'
import { ProfilePageClient } from '@/views/ProfilePage'

export const metadata: Metadata = { title: 'Профиль' }

export default function ProfilePage() {
  return <ProfilePageClient />
}
