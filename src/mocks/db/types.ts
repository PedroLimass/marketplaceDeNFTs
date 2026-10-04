import type { NetworkId, NftBadge } from '@/features/catalog/schemas/catalog.schemas'
import type { OrderDto } from '@/features/orders/schemas/order.schemas'
import type { QuoteDto } from '@/features/cart/schemas/cart.schemas'
import type { WalletRole, WalletType } from '@/features/wallets/schemas/wallet.schemas'

export const DB_SCHEMA_VERSION = 6

export interface UserRecord {
  id: string
  username: string
  displayName: string
  email: string
  passwordSalt: string
  passwordHash: string
  ensName: string | null
  walletNickname: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: number
}

export interface EditionRecord {
  id: string
  label: string
  supply: number
  available: number
}

export interface NftRecord {
  id: string
  tokenId: string
  name: string
  priceEth: string
  previousPriceEth: string | null
  art: 1 | 2 | 3 | 4
  collectionId: string
  categoryId: string
  network: NetworkId
  badge: NftBadge | null
  version: number
  listedAt: string
  isNew: boolean
  trendingRank: number | null
  description: string
  attributes: string[]
  editions: EditionRecord[]
  creator: { name: string; royaltyPercent: number }
  contractAddress: string
  rating: { average: number; count: number }
}

export interface CartItemRecord {
  id: string
  nftId: string
  editionId: string
  quantity: number
  priceSeenEth: string
}

export interface WalletRecord {
  id: string
  role: WalletRole
  type: WalletType
  network: NetworkId
  address: string
  nickname: string
  ensName: string | null
  sameAsPrimary: boolean
  connected?: boolean
}

export interface QuoteRecord {
  ownerKey: string
  couponCode: string | null
  createdAt: number
  dto: QuoteDto
}

export interface OrderRecord {
  userId: string
  resolveAt: number
  outcome: 'confirmed' | 'rejected'
  purchased: { nftId: string; editionId: string; quantity: number }[]
  dto: OrderDto
}

export interface IdempotencyRecord {
  bodyHash: string
  orderId: string
  createdAt: number
}

export interface MockDbState {
  schemaVersion: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: Record<string, string[]>
  carts: Record<string, CartItemRecord[]>
  wallets: Record<string, WalletRecord[]>
  quotes: Record<string, QuoteRecord>
  orders: OrderRecord[]
  idempotency: Record<string, IdempotencyRecord>
  scenarioEffects: Record<string, true>
}
