import { useQuery } from '@tanstack/react-query'

import { featuredNftsQueryOptions, nftListQueryOptions } from '../api/catalogQueries'
import type { CatalogFilters } from '../types/catalog'

export function useNftList(filters: CatalogFilters) {
  return useQuery(nftListQueryOptions(filters))
}

export function useFeaturedNfts() {
  return useQuery(featuredNftsQueryOptions())
}
