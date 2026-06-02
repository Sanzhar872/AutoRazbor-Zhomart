import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
import { HeroBanner } from '@/views/HomePage/HeroBanner'
import { PopularCategories } from '@/views/HomePage/PopularCategories'
import { FeaturedParts } from '@/views/HomePage/FeaturedParts'
import { CallToAction } from '@/views/HomePage/CallToAction'
import { PageContainer } from '@/components/layout/PageContainer'

export const metadata: Metadata = {
  title: 'АвтоРазбор — Б/У запчасти в Алматы',
  description: 'Магазин б/у автозапчастей. Большой выбор, честные цены. Звоните!',
}

export default function HomePage() {
  return (
    <PageContainer className="flex flex-col gap-10 pb-24 md:pb-8">
      <HeroBanner />
      <PopularCategories />
      <FeaturedParts />
      <CallToAction />
    </PageContainer>
  )
}
