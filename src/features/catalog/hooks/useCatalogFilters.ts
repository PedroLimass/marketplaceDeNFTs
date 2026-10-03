import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'

import { filtersToSearch, searchToFilters } from '../search/catalogSearch'
import type { CatalogFilters } from '../types/catalog'

export type FiltersPatch = Partial<CatalogFilters>

interface UpdateOptions {
  /** Digitação não deve empilhar uma entrada de histórico por tecla. */
  replace?: boolean
}

/**
 * Os filtros do catálogo vivem na URL: este hook é a única ponte entre ela e os componentes.
 * Qualquer mudança de filtro, aba ou ordem volta para a página 1.
 */
export function useCatalogFilters() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })
  const filters = useMemo(() => searchToFilters(search), [search])

  const update = useCallback(
    (patch: FiltersPatch, options: UpdateOptions = {}) => {
      const next: CatalogFilters = { ...filters, ...patch, page: patch.page ?? 1 }

      void navigate({
        to: '/',
        search: (previous) => ({ ...previous, ...filtersToSearch(next) }),
        replace: options.replace ?? false,
        resetScroll: false,
      })
    },
    [filters, navigate],
  )

  const clear = useCallback(() => {
    update({ q: '', categories: [], networks: [], minPrice: undefined, maxPrice: undefined })
  }, [update])

  return { filters, update, clear }
}
