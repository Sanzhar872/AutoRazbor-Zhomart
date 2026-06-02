'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth.api'

export function TokenRefreshOnMount() {
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
          qc.invalidateQueries({ queryKey: ['parts'] })
        })
        .catch(() => clearAuth())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
