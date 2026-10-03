import type { UseQueryResult } from '@tanstack/react-query'

import type { FiltersPatch } from '../hooks/useCatalogFilters'
import { countActiveFilters } from '../search/catalogSearch'
import type { CatalogFilters, NftPage } from '../types/catalog'
import { CatalogSearchField } from './CatalogSearchField'
import { MobileFiltersSheet } from './MobileFiltersSheet'

interface MobileCatalogBarProps {
  filters: CatalogFilters
  list: UseQueryResult<NftPage>
  onChange: (patch: FiltersPatch) => void
  onClear: () => void
}

/** Busca e botão de filtros do topo da tela no celular (no desktop vivem no cabeçalho e na lateral). */
export function MobileCatalogBar({ filters, list, onChange, onClear }: MobileCatalogBarProps) {
  return (
    <div className="flex items-center gap-2 md:hidden">
      <CatalogSearchField variant="mobile" className="min-w-0 flex-1" />
      <MobileFiltersSheet
        filters={filters}
        facets={list.data?.facets}
        failed={list.isError}
        total={list.data?.total}
        activeCount={countActiveFilters(filters)}
        onChange={onChange}
        onClear={onClear}
      />
    </div>
  )
}
