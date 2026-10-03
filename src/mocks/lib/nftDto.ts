import type {
  NftDetailDto,
  NftStatus,
  NftSummaryDto,
} from '@/features/catalog/schemas/catalog.schemas'

import type { NftRecord } from '../db/types'
import { categoryFixtures, collectionFixtures } from '../fixtures/nfts'
import { totalAvailable } from './catalogQuery'

export const MAX_PER_ORDER = 10

const artUrl = (art: number, size: '' | '-500' = '') =>
  `${import.meta.env.BASE_URL}assets/nfts/art-${String(art)}${size}.webp`

const statusOf = (available: number): NftStatus => (available > 0 ? 'open' : 'sold_out')

function refOf(list: readonly { id: string; name: string }[], id: string) {
  const found = list.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Referência de catálogo inexistente: ${id}`)
  return found
}

export function toNftSummaryDto(nft: NftRecord): NftSummaryDto {
  const available = totalAvailable(nft)

  return {
    id: nft.id,
    token_id: nft.tokenId,
    name: nft.name,
    price_eth: nft.priceEth,
    image_url: artUrl(nft.art),
    thumbnail_url: artUrl(nft.art, '-500'),
    collection: refOf(collectionFixtures, nft.collectionId),
    category: refOf(categoryFixtures, nft.categoryId),
    network: nft.network,
    badge: nft.badge,
    status: statusOf(available),
    available_quantity: available,
    version: nft.version,
  }
}

const standardByNetwork = { ethereum: 'ERC-721', polygon: 'ERC-721', solana: 'Metaplex' } as const

export function toNftDetailDto(nft: NftRecord): NftDetailDto {
  const arts = [nft.art, ...[1, 2, 3, 4].filter((art) => art !== nft.art)]

  return {
    ...toNftSummaryDto(nft),
    description: nft.description,
    gallery: arts.map((art, index) => ({
      url: artUrl(art),
      alt: `${nft.name}, vista ${String(index + 1)}`,
    })),
    editions: nft.editions.map((edition) => ({ ...edition, status: statusOf(edition.available) })),
    attributes: nft.attributes,
    creator: { name: nft.creator.name, royalty_percent: nft.creator.royaltyPercent },
    contract: {
      address: nft.contractAddress,
      standard: standardByNetwork[nft.network],
      network: nft.network,
      metadata_uri: `ipfs://bafybeigkurio0demo/${nft.tokenId}.json`,
    },
    rating: nft.rating,
    max_per_order: MAX_PER_ORDER,
  }
}
