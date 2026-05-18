import { HelmetProvider, Helmet } from 'react-helmet-async'
import { HeroBanner } from './HeroBanner'
import { PopularCategories } from './PopularCategories'
import { FeaturedParts } from './FeaturedParts'
import { CallToAction } from './CallToAction'
import { PageContainer } from '@/components/layout/PageContainer'

export function HomePage() {
  return (
    <>
      <Helmet>
        <title>АвтоРазбор — Б/У запчасти в Алматы</title>
        <meta name="description" content="Магазин б/у автозапчастей. Большой выбор, честные цены. Звоните!" />
      </Helmet>
      <PageContainer className="flex flex-col gap-10 pb-24 md:pb-8">
        <HeroBanner />
        <PopularCategories />
        <FeaturedParts />
        <CallToAction />
      </PageContainer>
    </>
  )
}
