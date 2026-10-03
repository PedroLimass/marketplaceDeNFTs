import { http } from '@/infrastructure/http/axios'

import { CATALOG_PAGE_SIZE } from '../constants'
import { mapFeatured, mapNftPage } from '../mappers/mapCatalog'
import { featuredResponseSchema, nftListResponseSchema } from '../schemas/catalog.schemas'
import type { CatalogFilters, FeaturedNfts, NftPage } from '../types/catalog'

/** Valores `undefined` são omitidos pelo Axios, e listas viram chaves repetidas. */
function toParams(filters: CatalogFilters) {
  return {
    q: filters.q || undefined,
    category: filters.categories,
    network: filters.networks,
    min_price: filters.minPrice,
    max_price: filters.maxPrice,
    listing: filters.listing === 'all' ? undefined : filters.listing,
    sort: filters.sort === 'recent' ? undefined : filters.sort,
    page: filters.page,
    page_size: CATALOG_PAGE_SIZE,
  }
}

export async function fetchNftPage(filters: CatalogFilters, signal: AbortSignal): Promise<NftPage> {
  const { data } = await http.get<unknown>('/nfts', { params: toParams(filters), signal })
  return mapNftPage(nftListResponseSchema.parse(data))
}

export async function fetchFeaturedNfts(signal: AbortSignal): Promise<FeaturedNfts> {
  const { data } = await http.get<unknown>('/nfts/featured', { signal })
  return mapFeatured(featuredResponseSchema.parse(data))
}
