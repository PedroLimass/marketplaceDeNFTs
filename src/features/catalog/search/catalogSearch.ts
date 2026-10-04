import { compareEth, isEthString } from '@/shared/lib/money'

import { MAX_SEARCH_LENGTH } from '../constants'
import {
  isNetworkId,
  type ListingFilter,
  type NetworkId,
  type SortOption,
} from '../schemas/catalog.schemas'
import type { CatalogFilters } from '../types/catalog'

export interface CatalogSearch {
  q?: string | undefined
  category?: string[] | undefined
  network?: NetworkId[] | undefined
  min?: string | undefined
  max?: string | undefined
  listing?: Exclude<ListingFilter, 'all'> | undefined
  sort?: Exclude<SortOption, 'recent'> | undefined
  page?: number | undefined
}

export const DEFAULT_FILTERS: CatalogFilters = {
  q: '',
  categories: [],
  networks: [],
  minPrice: undefined,
  maxPrice: undefined,
  listing: 'all',
  sort: 'recent',
  page: 1,
}

const CATEGORY_PATTERN = /^[a-z0-9-]{1,40}$/

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return typeof value === 'string' ? [value] : []
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort()
}

export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const q = asText(raw.q)?.trim().slice(0, MAX_SEARCH_LENGTH)

  const category = uniqueSorted(asList(raw.category).filter((id) => CATEGORY_PATTERN.test(id)))
  const network = uniqueSorted(asList(raw.network).filter(isNetworkId))

  let min = asText(raw.min)
  let max = asText(raw.max)
  min = min && isEthString(min) ? min : undefined
  max = max && isEthString(max) ? max : undefined
  if (min && max && compareEth(min, max) > 0) [min, max] = [max, min]

  const listing = asText(raw.listing)
  const sort = asText(raw.sort)
  const page = typeof raw.page === 'number' ? raw.page : Number(asText(raw.page))

  return {
    q: q === '' ? undefined : q,
    category: category.length > 0 ? category : undefined,
    network: network.length > 0 ? network : undefined,
    min,
    max,
    listing: listing === 'new' || listing === 'trending' ? listing : undefined,
    sort: sort === 'price-asc' || sort === 'price-desc' || sort === 'name' ? sort : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  }
}

export function searchToFilters(search: CatalogSearch): CatalogFilters {
  return {
    q: search.q ?? '',
    categories: search.category ?? [],
    networks: search.network ?? [],
    minPrice: search.min,
    maxPrice: search.max,
    listing: search.listing ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
  }
}

export function filtersToSearch(filters: CatalogFilters): CatalogSearch {
  return validateCatalogSearch({
    q: filters.q,
    category: filters.categories,
    network: filters.networks,
    min: filters.minPrice,
    max: filters.maxPrice,
    listing: filters.listing,
    sort: filters.sort,
    page: String(filters.page),
  })
}

export function countActiveFilters(filters: CatalogFilters): number {
  return (
    (filters.q ? 1 : 0) +
    filters.categories.length +
    filters.networks.length +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0)
  )
}
