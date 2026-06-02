import { AdminLayoutClient } from '@/views/admin/AdminLayout'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
