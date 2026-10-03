import { describe, expect, it } from 'vitest'

import { nftListResponseSchema, type NftSummaryDto } from '../schemas/catalog.schemas'
import { mapNftPage } from './mapCatalog'

const summary: NftSummaryDto = {
  id: 'emerald-ape-042',
  token_id: '0042',
  name: 'Emerald Ape #042',
  price_eth: '1.19',
  previous_price_eth: null,
  image_url: '/assets/nfts/art-1.webp',
  thumbnail_url: '/assets/nfts/art-1-500.webp',
  collection: { id: 'kurio-apes', name: 'Kurio Apes' },
  category: { id: 'arte-digital', name: 'Arte digital' },
  network: 'ethereum',
  badge: 'rare',
  status: 'open',
  available_quantity: 50,
  version: 3,
}

const response = {
  items: [summary],
  page: 1,
  page_size: 9,
  total: 36,
  total_pages: 4,
  facets: {
    categories: [{ id: 'arte-digital', name: 'Arte digital', count: 5 }],
    networks: [{ id: 'ethereum', name: 'Ethereum', count: 12 }],
    price_range: { min_eth: '0.02', max_eth: '12.30' },
  },
}

describe('mapNftPage', () => {
  it('converte o contrato snake_case para o modelo camelCase', () => {
    const page = mapNftPage(nftListResponseSchema.parse(response))

    expect(page.pageSize).toBe(9)
    expect(page.totalPages).toBe(4)
    expect(page.facets.priceRange).toEqual({ minEth: '0.02', maxEth: '12.30' })
    expect(page.items[0]).toMatchObject({
      tokenId: '0042',
      priceEth: '1.19',
      thumbnailUrl: '/assets/nfts/art-1-500.webp',
      availableQuantity: 50,
    })
  })

  it('rejeita preços que não são strings decimais de ETH', () => {
    const invalid = { ...response, items: [{ ...summary, price_eth: 1.19 }] }

    expect(nftListResponseSchema.safeParse(invalid).success).toBe(false)
    expect(
      nftListResponseSchema.safeParse({ ...response, items: [{ ...summary, price_eth: '1,19' }] })
        .success,
    ).toBe(false)
  })
})
