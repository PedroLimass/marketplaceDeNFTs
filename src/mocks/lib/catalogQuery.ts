import { z } from 'zod'

import {
  ethAmountSchema,
  listingFilterSchema,
  networkIdSchema,
  sortOptionSchema,
  type CatalogFacetsDto,
} from '@/features/catalog/schemas/catalog.schemas'
import { compareEth } from '@/shared/lib/money'

import type { NftRecord } from '../db/types'
import { categoryFixtures, networkFixtures } from '../fixtures/nfts'

export const catalogParamsSchema = z.object({
  q: z.string().trim().default(''),
  category: z.array(z.string()),
  network: z.array(networkIdSchema),
  min_price: ethAmountSchema.optional(),
  max_price: ethAmountSchema.optional(),
  listing: listingFilterSchema.default('all'),
  sort: sortOptionSchema.default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(50).default(9),
  collection: z.string().optional(),
  exclude: z.string().optional(),
})

export type CatalogParams = z.infer<typeof catalogParamsSchema>

/** Repete chave vira lista (`category=a&category=b`); chave ausente vira `undefined`. */
export function readCatalogParams(searchParams: URLSearchParams) {
  const single = (key: string) => searchParams.get(key) ?? undefined

  return catalogParamsSchema.safeParse({
    q: single('q'),
    category: searchParams.getAll('category'),
    network: searchParams.getAll('network'),
    min_price: single('min_price'),
    max_price: single('max_price'),
    listing: single('listing'),
    sort: single('sort'),
    page: single('page'),
    page_size: single('page_size'),
    collection: single('collection'),
    exclude: single('exclude'),
  })
}

export function totalAvailable(nft: NftRecord): number {
  return nft.editions.reduce((sum, edition) => sum + edition.available, 0)
}

type Dimension = 'category' | 'network' | 'price'

function matches(nft: NftRecord, params: CatalogParams, skip?: Dimension): boolean {
  const query = params.q.toLowerCase()

  if (query) {
    const haystack = [nft.name, nft.tokenId, nft.collectionId.replaceAll('-', ' ')]
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(query)) return false
  }

  if (
    skip !== 'category' &&
    params.category.length > 0 &&
    !params.category.includes(nft.categoryId)
  ) {
    return false
  }
  if (skip !== 'network' && params.network.length > 0 && !params.network.includes(nft.network)) {
    return false
  }
  if (skip !== 'price') {
    if (params.min_price && compareEth(nft.priceEth, params.min_price) < 0) return false
    if (params.max_price && compareEth(nft.priceEth, params.max_price) > 0) return false
  }

  if (params.collection && nft.collectionId !== params.collection) return false
  if (params.exclude && nft.id === params.exclude) return false
  if (params.listing === 'new' && !nft.isNew) return false
  if (params.listing === 'trending' && nft.trendingRank === null) return false

  return true
}

function compare(sort: CatalogParams['sort']) {
  return (a: NftRecord, b: NftRecord): number => {
    const byId = a.id.localeCompare(b.id)

    switch (sort) {
      case 'recent':
        return b.listedAt.localeCompare(a.listedAt) || byId
      case 'price-asc':
        return compareEth(a.priceEth, b.priceEth) || byId
      case 'price-desc':
        return compareEth(b.priceEth, a.priceEth) || byId
      case 'name':
        return a.name.localeCompare(b.name, 'pt-BR') || byId
    }
  }
}

function buildFacets(all: readonly NftRecord[], params: CatalogParams): CatalogFacetsDto {
  const forCategories = all.filter((nft) => matches(nft, params, 'category'))
  const forNetworks = all.filter((nft) => matches(nft, params, 'network'))
  const prices = all.map((nft) => nft.priceEth).sort(compareEth)

  return {
    categories: categoryFixtures.map((category) => ({
      ...category,
      count: forCategories.filter((nft) => nft.categoryId === category.id).length,
    })),
    networks: networkFixtures.map((network) => ({
      ...network,
      count: forNetworks.filter((nft) => nft.network === network.id).length,
    })),
    price_range: { min_eth: prices[0] ?? '0', max_eth: prices.at(-1) ?? '0' },
  }
}

export interface CatalogResult {
  items: NftRecord[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: CatalogFacetsDto
}

export function queryCatalog(all: readonly NftRecord[], params: CatalogParams): CatalogResult {
  const matched = all.filter((nft) => matches(nft, params)).sort(compare(params.sort))
  const start = (params.page - 1) * params.page_size

  return {
    items: matched.slice(start, start + params.page_size),
    page: params.page,
    pageSize: params.page_size,
    total: matched.length,
    totalPages: Math.ceil(matched.length / params.page_size),
    facets: buildFacets(all, params),
  }
}
