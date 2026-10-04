import type { NetworkId, NftBadge } from '@/features/catalog/schemas/catalog.schemas'
import type { WalletRole, WalletType } from '@/features/wallets/schemas/wallet.schemas'

export const DB_SCHEMA_VERSION = 5

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
  /** Instante de expiração, em milissegundos desde a época Unix. */
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
  /** Qual das 4 artes do Figma ilustra o NFT (`art-N.webp`). */
  art: 1 | 2 | 3 | 4
  collectionId: string
  categoryId: string
  network: NetworkId
  badge: NftBadge | null
  /** Aumenta a cada mudança de preço ou estoque, para o cliente descartar dados antigos. */
  version: number
  listedAt: string
  isNew: boolean
  /** Posição na aba "Em alta" (1 é o mais quente); `null` fora dela. */
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
  /** Preço que o usuário viu ao adicionar ou ao aceitar a última mudança. */
  priceSeenEth: string
}

export interface WalletRecord {
  id: string
  role: WalletRole
  type: WalletType
  network: NetworkId
  address: string
  nickname: string
  /** Rótulo ENS sem o sufixo `.eth`. */
  ensName: string | null
  /** Só na secundária: os dados exibidos vêm sempre da principal, mesmo se ela mudar depois. */
  sameAsPrimary: boolean
}

export interface MockDbState {
  schemaVersion: number
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  /** Ids de NFT favoritados, por id de usuário. */
  favorites: Record<string, string[]>
  /** Itens do carrinho por dono: `user:<id>` ou `guest:<uuid>`. */
  carts: Record<string, CartItemRecord[]>
  /** Carteiras por id de usuário (no máximo uma por papel). */
  wallets: Record<string, WalletRecord[]>
}
