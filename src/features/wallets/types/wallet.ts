import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'

import type { WalletRole, WalletType } from '../schemas/wallet.schemas'

export interface Wallet {
  id: string
  role: WalletRole
  type: WalletType
  network: NetworkId
  address: string
  nickname: string
  ensName: string | null
  sameAsPrimary: boolean
  connected: boolean
}
