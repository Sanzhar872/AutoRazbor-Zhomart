import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/lib/router'
import '@/styles/globals.css'

// After a new Vercel deploy, old cached chunk hashes no longer exist.
// Catch the error and reload once to pick up the new assets.
window.addEventListener('unhandledrejection', (e) => {
  const msg: string = e.reason?.message ?? ''
  if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    const reloaded = sessionStorage.getItem('chunk-reload')
    if (!reloaded) {
      sessionStorage.setItem('chunk-reload', '1')
      window.location.reload()
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
