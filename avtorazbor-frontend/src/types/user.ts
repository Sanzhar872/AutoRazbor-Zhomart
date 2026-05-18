export type UserRole = 'admin' | 'customer'

export interface User {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  created_at: string
}
