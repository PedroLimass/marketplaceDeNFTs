import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import type { CatalogFilters } from '../types/catalog'
import { fetchFeaturedNfts, fetchNftDetail, fetchNftPage, fetchRelatedNfts } from './catalogApi'
import { catalogKeys } from './catalogKeys'

export const nftListQueryOptions = (filters: CatalogFilters) =>
  queryOptions({
    queryKey: catalogKeys.list(filters),
    queryFn: ({ signal }) => fetchNftPage(filters, signal),
    placeholderData: keepPreviousData,
  })

export const featuredNftsQueryOptions = () =>
  queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: ({ signal }) => fetchFeaturedNfts(signal),
  })

export const nftDetailQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: catalogKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNftDetail(nftId, signal),
  })

export const relatedNftsQueryOptions = (collectionId: string, excludeId: string) =>
  queryOptions({
    queryKey: catalogKeys.related(collectionId, excludeId),
    queryFn: ({ signal }) => fetchRelatedNfts(collectionId, excludeId, signal),
  })
