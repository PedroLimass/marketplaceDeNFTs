import { CatalogSection } from '../components/CatalogSection'
import { HeroBanner } from '../components/HeroBanner'
import { MobileCatalogBar } from '../components/MobileCatalogBar'
import { useNftList } from '../hooks/useCatalog'
import { useCatalogFilters } from '../hooks/useCatalogFilters'

export function HomePage() {
  const { filters, update, clear } = useCatalogFilters()
  const list = useNftList(filters)

  return (
    <div className="flex flex-col gap-4 pt-10 pb-16 md:gap-24 md:pt-8 md:pb-24">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-6 md:px-8 xl:px-0">
        <MobileCatalogBar filters={filters} list={list} onChange={update} onClear={clear} />
        <HeroBanner />
      </div>
      <CatalogSection filters={filters} list={list} onChange={update} onClear={clear} />
    </div>
  )
}
