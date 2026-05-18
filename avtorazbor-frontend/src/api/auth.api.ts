import { client } from './client'
import type { User } from '@/types/user'

export const authApi = {
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    client.post<User>('/auth/register', data).then((r) => r.data),

  login: (email: string, password: string) =>
    client
      .post<{ access_token: string; refresh_token: string }>('/auth/login', { email, password })
      .then((r) => r.data),

  refresh: (refresh_token: string) =>
    client
      .post<{ access_token: string; refresh_token: string }>('/auth/refresh', { refresh_token })
      .then((r) => r.data),

  logout: (refresh_token: string) =>
    client.post('/auth/logout', { refresh_token }),

  me: () => client.get<User>('/auth/me').then((r) => r.data),

  updateMe: (data: { full_name?: string; phone?: string }) =>
    client.patch<User>('/auth/me', data).then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    client.post('/auth/change-password', { current_password, new_password }),
}
