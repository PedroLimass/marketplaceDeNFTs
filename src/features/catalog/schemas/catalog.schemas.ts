import { z } from 'zod'

import { isEthString } from '@/shared/lib/money'

export const networkIds = ['ethereum', 'polygon', 'solana'] as const
export const nftBadges = ['rare', 'limited'] as const
export const nftStatuses = ['open', 'sold_out'] as const
export const listingFilters = ['all', 'new', 'trending'] as const
export const sortOptions = ['recent', 'price-asc', 'price-desc', 'name'] as const

export const networkIdSchema = z.enum(networkIds)
export const nftBadgeSchema = z.enum(nftBadges)
export const nftStatusSchema = z.enum(nftStatuses)
export const listingFilterSchema = z.enum(listingFilters)
export const sortOptionSchema = z.enum(sortOptions)

export function isNetworkId(value: string): value is NetworkId {
  return networkIds.some((known) => known === value)
}

export function isListingFilter(value: string): value is ListingFilter {
  return listingFilters.some((known) => known === value)
}

export function isSortOption(value: string): value is SortOption {
  return sortOptions.some((known) => known === value)
}

export const ethAmountSchema = z.string().refine(isEthString, 'Valor em ETH inválido.')

const refSchema = z.object({ id: z.string(), name: z.string() })

export const nftSummaryDtoSchema = z.object({
  id: z.string(),
  token_id: z.string(),
  name: z.string(),
  price_eth: ethAmountSchema,
  previous_price_eth: ethAmountSchema.nullable(),
  image_url: z.string(),
  thumbnail_url: z.string(),
  collection: refSchema,
  category: refSchema,
  network: networkIdSchema,
  badge: nftBadgeSchema.nullable(),
  status: nftStatusSchema,
  available_quantity: z.number().int().nonnegative(),
  version: z.number().int().nonnegative(),
})

const facetEntrySchema = refSchema.extend({ count: z.number().int().nonnegative() })

export const catalogFacetsDtoSchema = z.object({
  categories: z.array(facetEntrySchema),
  networks: z.array(facetEntrySchema),
  price_range: z.object({ min_eth: ethAmountSchema, max_eth: ethAmountSchema }),
})

export const nftListResponseSchema = z.object({
  items: z.array(nftSummaryDtoSchema),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
  facets: catalogFacetsDtoSchema,
})

export const featuredResponseSchema = z.object({
  featured: nftSummaryDtoSchema,
  trending: z.array(nftSummaryDtoSchema),
})

export const nftEditionDtoSchema = z.object({
  id: z.string(),
  label: z.string(),
  supply: z.number().int().positive(),
  available: z.number().int().nonnegative(),
  status: nftStatusSchema,
})

export const nftDetailDtoSchema = nftSummaryDtoSchema.extend({
  description: z.string(),
  gallery: z.array(z.object({ url: z.string(), alt: z.string() })),
  editions: z.array(nftEditionDtoSchema),
  attributes: z.array(z.string()),
  creator: z.object({ name: z.string(), royalty_percent: z.number().nonnegative() }),
  contract: z.object({
    address: z.string(),
    standard: z.string(),
    network: networkIdSchema,
    metadata_uri: z.string(),
  }),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().nonnegative() }),
  max_per_order: z.number().int().positive(),
})

export type NetworkId = z.infer<typeof networkIdSchema>
export type NftBadge = z.infer<typeof nftBadgeSchema>
export type NftStatus = z.infer<typeof nftStatusSchema>
export type ListingFilter = z.infer<typeof listingFilterSchema>
export type SortOption = z.infer<typeof sortOptionSchema>
export type NftSummaryDto = z.infer<typeof nftSummaryDtoSchema>
export type NftDetailDto = z.infer<typeof nftDetailDtoSchema>
export type NftEditionDto = z.infer<typeof nftEditionDtoSchema>
export type CatalogFacetsDto = z.infer<typeof catalogFacetsDtoSchema>
export type NftListResponse = z.infer<typeof nftListResponseSchema>
export type FeaturedResponse = z.infer<typeof featuredResponseSchema>
