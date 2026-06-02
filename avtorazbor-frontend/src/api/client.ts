import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/constants/routes'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1'

export const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<(token: string) => void> = []

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(client(original))
          })
        })
      }

      isRefreshing = true
      const refreshToken = useAuthStore.getState().refreshToken

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          data.access_token,
          data.refresh_token,
        )
        queue.forEach((cb) => cb(data.access_token))
        queue = []
        original.headers.Authorization = `Bearer ${data.access_token}`
        return client(original)
      } catch {
        useAuthStore.getState().clearAuth()
        if (typeof window !== 'undefined') window.location.href = ROUTES.LOGIN
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail ?? error.message
  }
  return 'Неизвестная ошибка'
}
