const BACKEND = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? 'http://localhost:5000'

export function resolveUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${BACKEND}${url}`
}
