import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'
import type { WalletType } from '@/features/wallets/schemas/wallet.schemas'

import type { OrderStatus } from '../schemas/order.schemas'

export interface OrderItem {
  nftId: string
  name: string
  tokenId: string
  imageUrl: string
  editionLabel: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
}

export interface Order {
  id: string
  status: OrderStatus
  version: number
  items: OrderItem[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  network: NetworkId
  wallet: { type: WalletType; label: string; address: string }
  collector: { displayName: string; email: string }
  transaction: { hash: string; explorerUrl: string } | null
  rejection: { code: string; message: string } | null
  createdAt: string
  resolvedAt: string | null
}

export const isTerminal = (order: Pick<Order, 'status'>): boolean => order.status !== 'pending'
