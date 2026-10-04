import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'

import { filtersToSearch, searchToFilters, validateCatalogSearch } from '../search/catalogSearch'
import type { CatalogFilters } from '../types/catalog'

export type FiltersPatch = Partial<CatalogFilters>

interface UpdateOptions {
  replace?: boolean
}

export function useCatalogFilters() {
  const rawSearch = useSearch({ strict: false })
  const search = useMemo(() => validateCatalogSearch(rawSearch), [rawSearch])
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
