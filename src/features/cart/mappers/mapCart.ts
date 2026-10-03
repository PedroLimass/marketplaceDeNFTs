import type {
  CartIssueDto,
  CartItemDto,
  CartMergeResponse,
  QuoteDto,
} from '../schemas/cart.schemas'
import type { CartIssue, CartItem, CartMergeAdjustment, Quote } from '../types/cart'

function mapIssue(dto: CartIssueDto): CartIssue {
  switch (dto.code) {
    case 'price_changed':
      return {
        code: 'price_changed',
        previousPriceEth: dto.previous_price_eth,
        priceEth: dto.price_eth,
      }
    case 'insufficient_availability':
      return { code: 'insufficient_availability', available: dto.available }
    case 'sold_out':
      return { code: 'sold_out' }
  }
}

export function mapCartItem(dto: CartItemDto): CartItem {
  return {
    id: dto.id,
    nft: {
      id: dto.nft.id,
      name: dto.nft.name,
      tokenId: dto.nft.token_id,
      thumbnailUrl: dto.nft.thumbnail_url,
      network: dto.nft.network,
      status: dto.nft.status,
      version: dto.nft.version,
    },
    edition: dto.edition,
    quantity: dto.quantity,
    maxQuantity: dto.max_quantity,
    unitPriceEth: dto.unit_price_eth,
    lineTotalEth: dto.line_total_eth,
    issues: dto.issues.map(mapIssue),
  }
}

export function mapAdjustments(dto: CartMergeResponse['adjusted']): CartMergeAdjustment[] {
  return dto.map((entry) => ({
    nftId: entry.nft_id,
    name: entry.name,
    requested: entry.requested,
    applied: entry.applied,
  }))
}

export function mapQuote(dto: QuoteDto): Quote {
  return {
    id: dto.id,
    items: dto.items.map((item) => ({
      nftId: item.nft_id,
      editionId: item.edition_id,
      quantity: item.quantity,
      unitPriceEth: item.unit_price_eth,
      lineTotalEth: item.line_total_eth,
      nftVersion: item.nft_version,
    })),
    subtotalEth: dto.subtotal_eth,
    discountEth: dto.discount_eth,
    networkFeeEth: dto.network_fee_eth,
    totalEth: dto.total_eth,
    coupon: dto.coupon,
    network: dto.network,
    issues: dto.issues.map((issue) => ({ nftId: issue.nft_id, code: issue.code })),
    expiresAt: dto.expires_at,
  }
}
