import { describe, expect, it } from 'vitest'

import type { CartItemDto, CartMergeResponse, QuoteDto } from '../schemas/cart.schemas'
import { mapAdjustments, mapCartItem, mapQuote } from './mapCart'

const itemDto = (issues: CartItemDto['issues'] = []): CartItemDto => ({
  id: 'ci_1',
  nft: {
    id: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    token_id: '0042',
    thumbnail_url: '/art.webp',
    network: 'ethereum',
    status: 'open',
    version: 3,
  },
  edition: { id: '1/50', label: '1/50', available: 40 },
  quantity: 2,
  max_quantity: 8,
  unit_price_eth: '1.19',
  line_total_eth: '2.38',
  issues,
})

describe('mapCartItem', () => {
  it('mapeia mudança de preço, estoque insuficiente e esgotado', () => {
    const item = mapCartItem(
      itemDto([
        { code: 'price_changed', previous_price_eth: '1.10', price_eth: '1.19' },
        { code: 'insufficient_availability', available: 1 },
        { code: 'sold_out' },
      ]),
    )

    expect(item.issues).toEqual([
      { code: 'price_changed', previousPriceEth: '1.10', priceEth: '1.19' },
      { code: 'insufficient_availability', available: 1 },
      { code: 'sold_out' },
    ])
    expect(item.nft.tokenId).toBe('0042')
    expect(item.lineTotalEth).toBe('2.38')
  })
})

describe('mapAdjustments', () => {
  it('converte o ajuste da união do carrinho', () => {
    const adjusted: CartMergeResponse['adjusted'] = [
      { nft_id: 'emerald-ape-042', name: 'Emerald Ape #042', requested: 5, applied: 2 },
    ]

    expect(mapAdjustments(adjusted)).toEqual([
      { nftId: 'emerald-ape-042', name: 'Emerald Ape #042', requested: 5, applied: 2 },
    ])
  })
})

describe('mapQuote', () => {
  it('mapeia totais, cupom e pendências', () => {
    const dto: QuoteDto = {
      id: 'quo_1',
      items: [
        {
          nft_id: 'emerald-ape-042',
          edition_id: '1/50',
          quantity: 1,
          unit_price_eth: '1.19',
          line_total_eth: '1.19',
          nft_version: 3,
        },
      ],
      subtotal_eth: '1.19',
      discount_eth: '0.11',
      network_fee_eth: '0.016',
      total_eth: '1.096',
      coupon: { code: 'LANCAMENTO10', label: 'Lançamento', percent: 10 },
      network: 'ethereum',
      issues: [{ nft_id: 'emerald-ape-042', code: 'price_changed' }],
      expires_at: '2026-07-29T15:00:00.000Z',
    }

    expect(mapQuote(dto)).toMatchObject({
      id: 'quo_1',
      items: [{ nftId: 'emerald-ape-042', editionId: '1/50', nftVersion: 3 }],
      coupon: { code: 'LANCAMENTO10' },
      issues: [{ nftId: 'emerald-ape-042', code: 'price_changed' }],
    })
  })
})
