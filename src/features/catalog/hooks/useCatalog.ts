import { useQuery } from '@tanstack/react-query'

import {
  featuredNftsQueryOptions,
  nftDetailQueryOptions,
  nftListQueryOptions,
  relatedNftsQueryOptions,
} from '../api/catalogQueries'
import type { CatalogFilters } from '../types/catalog'

export function useNftList(filters: CatalogFilters) {
  return useQuery(nftListQueryOptions(filters))
}

export function useFeaturedNfts() {
  return useQuery(featuredNftsQueryOptions())
}

export function useNftDetail(nftId: string) {
  return useQuery(nftDetailQueryOptions(nftId))
}

export function useRelatedNfts(collectionId: string | undefined, excludeId: string) {
  return useQuery({
    ...relatedNftsQueryOptions(collectionId ?? '', excludeId),
    enabled: collectionId !== undefined,
  })
}
