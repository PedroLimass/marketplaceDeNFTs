import type {
  CatalogFacetsDto,
  FeaturedResponse,
  NftDetailDto,
  NftListResponse,
  NftSummaryDto,
} from '../schemas/catalog.schemas'
import type { CatalogFacets, FeaturedNfts, Nft, NftDetail, NftPage } from '../types/catalog'

export function mapNft(dto: NftSummaryDto): Nft {
  return {
    id: dto.id,
    tokenId: dto.token_id,
    name: dto.name,
    priceEth: dto.price_eth,
    previousPriceEth: dto.previous_price_eth,
    imageUrl: dto.image_url,
    thumbnailUrl: dto.thumbnail_url,
    collection: dto.collection,
    category: dto.category,
    network: dto.network,
    badge: dto.badge,
    status: dto.status,
    availableQuantity: dto.available_quantity,
    version: dto.version,
  }
}

export function mapNftDetail(dto: NftDetailDto): NftDetail {
  return {
    ...mapNft(dto),
    description: dto.description,
    gallery: dto.gallery,
    editions: dto.editions,
    attributes: dto.attributes,
    creator: { name: dto.creator.name, royaltyPercent: dto.creator.royalty_percent },
    contract: {
      address: dto.contract.address,
      standard: dto.contract.standard,
      network: dto.contract.network,
      metadataUri: dto.contract.metadata_uri,
    },
    rating: dto.rating,
    maxPerOrder: dto.max_per_order,
  }
}

function mapFacets(dto: CatalogFacetsDto): CatalogFacets {
  return {
    categories: dto.categories,
    networks: dto.networks,
    priceRange: { minEth: dto.price_range.min_eth, maxEth: dto.price_range.max_eth },
  }
}

export function mapNftPage(dto: NftListResponse): NftPage {
  return {
    items: dto.items.map(mapNft),
    page: dto.page,
    pageSize: dto.page_size,
    total: dto.total,
    totalPages: dto.total_pages,
    facets: mapFacets(dto.facets),
  }
}

export function mapFeatured(dto: FeaturedResponse): FeaturedNfts {
  return { featured: mapNft(dto.featured), trending: dto.trending.map(mapNft) }
}
