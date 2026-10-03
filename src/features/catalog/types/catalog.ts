import type {
  ListingFilter,
  NetworkId,
  NftBadge,
  NftStatus,
  SortOption,
} from '../schemas/catalog.schemas'

export interface NamedRef {
  id: string
  name: string
}

export interface Nft {
  id: string
  tokenId: string
  name: string
  priceEth: string
  imageUrl: string
  thumbnailUrl: string
  collection: NamedRef
  category: NamedRef
  network: NetworkId
  badge: NftBadge | null
  status: NftStatus
  availableQuantity: number
  version: number
}

export interface NftEdition {
  id: string
  label: string
  supply: number
  available: number
  status: NftStatus
}

export interface NftDetail extends Nft {
  description: string
  gallery: { url: string; alt: string }[]
  editions: NftEdition[]
  attributes: string[]
  creator: { name: string; royaltyPercent: number }
  contract: { address: string; standard: string; network: NetworkId; metadataUri: string }
  rating: { average: number; count: number }
  maxPerOrder: number
}

export interface FacetEntry extends NamedRef {
  count: number
}

export interface CatalogFacets {
  categories: FacetEntry[]
  networks: FacetEntry[]
  priceRange: { minEth: string; maxEth: string }
}

export interface NftPage {
  items: Nft[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  facets: CatalogFacets
}

export interface FeaturedNfts {
  featured: Nft
  trending: Nft[]
}

/** Estado do catálogo que vive na URL: é a fonte de verdade de filtros, aba, ordem e página. */
export interface CatalogFilters {
  q: string
  categories: string[]
  networks: NetworkId[]
  minPrice: string | undefined
  maxPrice: string | undefined
  listing: ListingFilter
  sort: SortOption
  page: number
}
