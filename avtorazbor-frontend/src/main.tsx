import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/lib/router'
import '@/styles/globals.css'

// After a new Vercel deploy, old cached chunk hashes no longer exist.
// Always reload on chunk fetch failure — Vercel always has valid chunks so
// there's no infinite-loop risk after a hard reload.
window.addEventListener('unhandledrejection', (e) => {
  const msg: string = e.reason?.message ?? ''
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Unable to preload CSS')
  ) {
    window.location.reload()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
