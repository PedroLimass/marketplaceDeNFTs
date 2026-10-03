import type { NetworkId, NftStatus } from '@/features/catalog/schemas/catalog.schemas'

export type CartIssue =
  | { code: 'price_changed'; previousPriceEth: string; priceEth: string }
  | { code: 'insufficient_availability'; available: number }
  | { code: 'sold_out' }

export interface CartItem {
  id: string
  nft: {
    id: string
    name: string
    tokenId: string
    thumbnailUrl: string
    network: NetworkId
    status: NftStatus
    version: number
  }
  edition: { id: string; label: string; available: number }
  quantity: number
  maxQuantity: number
  unitPriceEth: string
  lineTotalEth: string
  issues: CartIssue[]
}

export interface CartMergeAdjustment {
  nftId: string
  name: string
  requested: number
  applied: number
}

export interface Quote {
  id: string
  items: {
    nftId: string
    editionId: string
    quantity: number
    unitPriceEth: string
    lineTotalEth: string
    nftVersion: number
  }[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: { code: string; label: string; percent: number } | null
  network: NetworkId
  issues: { nftId: string; code: CartIssue['code'] }[]
  expiresAt: string
}
