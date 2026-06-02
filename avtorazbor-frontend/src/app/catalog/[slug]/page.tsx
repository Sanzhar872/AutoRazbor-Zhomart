import type { Metadata } from 'next'
import { partsApi } from '@/api/parts.api'
import { PartPageClient } from '@/views/PartPage'

export const revalidate = 300 // ISR: обновлять каждые 5 минут

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const part = await partsApi.getBySlug(params.slug)
    return {
      title: part.title,
      description: `Б/У ${part.title}. ${part.description ?? ''} Звоните!`,
      openGraph: {
        images: part.images.find((i) => i.is_primary)?.public_url
          ? [part.images.find((i) => i.is_primary)!.public_url]
          : [],
      },
    }
  } catch {
    return { title: 'Запчасть не найдена' }
  }
}

export default function PartPage({ params }: Props) {
  return <PartPageClient slug={params.slug} />
}
