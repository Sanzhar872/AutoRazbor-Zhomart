'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/user'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  _hasHydrated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string) => void
  clearAuth: () => void
}

const ssrSafeStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(name)
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(name, value)
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'avtorazbor-auth',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (s) => ({
        user: s.user,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true })
      },
    }
  )
)
