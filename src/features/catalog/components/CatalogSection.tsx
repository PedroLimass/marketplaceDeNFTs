import type { UseQueryResult } from '@tanstack/react-query'
import { Tabs } from 'radix-ui'

import type { FiltersPatch } from '../hooks/useCatalogFilters'
import { isListingFilter } from '../schemas/catalog.schemas'
import { countActiveFilters } from '../search/catalogSearch'
import type { CatalogFilters, NftPage } from '../types/catalog'
import { CatalogEmpty, CatalogError } from './CatalogStates'
import { CatalogPagination } from './CatalogPagination'
import { CatalogToolbar } from './CatalogToolbar'
import { FeaturedNftBanner } from './FeaturedNftBanner'
import { FiltersPanel } from './FiltersPanel'
import { NftGrid, NftGridSkeleton } from './NftGrid'

const CATALOG_ID = 'catalogo'

function scrollToCatalog() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document
    .getElementById(CATALOG_ID)
    ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

interface CatalogSectionProps {
  filters: CatalogFilters
  list: UseQueryResult<NftPage>
  onChange: (patch: FiltersPatch) => void
  onClear: () => void
}

export function CatalogSection({
  filters,
  list,
  onChange: update,
  onClear: clear,
}: CatalogSectionProps) {
  const activeCount = countActiveFilters(filters)
  const facets = list.data?.facets

  return (
    <section
      id={CATALOG_ID}
      aria-labelledby="catalogo-titulo"
      className="mx-auto w-full max-w-[1200px] scroll-mt-6 px-6 md:px-8 xl:px-0"
    >
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>

      <div className="flex items-start gap-12">
        <aside aria-label="Filtros" className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex">
          <FiltersPanel filters={filters} facets={facets} failed={list.isError} onChange={update} />
          <FeaturedNftBanner />
        </aside>

        <Tabs.Root
          value={filters.listing}
          onValueChange={(value) => {
            if (isListingFilter(value)) update({ listing: value })
          }}
          className="flex min-w-0 flex-1 flex-col gap-8 md:gap-8"
        >
          <CatalogToolbar
            sort={filters.sort}
            onSortChange={(sort) => {
              update({ sort })
            }}
          />

          <Tabs.Content
            value={filters.listing}
            className="flex flex-col gap-8 outline-none md:gap-[88px]"
          >
            {list.isError ? (
              <CatalogError
                error={list.error}
                onRetry={() => {
                  void list.refetch()
                }}
              />
            ) : list.data ? (
              <>
                <p role="status" className="sr-only">
                  {list.data.total === 0
                    ? 'Nenhum NFT encontrado.'
                    : `${String(list.data.total)} NFTs encontrados. Página ${String(list.data.page)} de ${String(list.data.totalPages)}.`}
                </p>
                {list.data.items.length > 0 ? (
                  <NftGrid items={list.data.items} busy={list.isPlaceholderData} />
                ) : (
                  <CatalogEmpty hasFilters={activeCount > 0} onClear={clear} />
                )}
                <CatalogPagination
                  page={list.data.page}
                  totalPages={list.data.totalPages}
                  onNavigate={scrollToCatalog}
                />
              </>
            ) : (
              <>
                <p role="status" className="sr-only">
                  Carregando NFTs…
                </p>
                <NftGridSkeleton />
              </>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </section>
  )
}
