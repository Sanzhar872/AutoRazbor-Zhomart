const BACKEND = process.env.NEXT_PUBLIC_API_HOST ?? 'http://localhost:5000'

export function resolveUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${BACKEND}${url}`
}
