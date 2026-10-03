import type { CatalogFilters } from '../types/catalog'

export const catalogKeys = {
  all: ['catalog'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (filters: CatalogFilters) => [...catalogKeys.lists(), filters] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
  details: () => [...catalogKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...catalogKeys.details(), nftId] as const,
  related: (collectionId: string, excludeId: string) =>
    [...catalogKeys.all, 'related', collectionId, excludeId] as const,
}
