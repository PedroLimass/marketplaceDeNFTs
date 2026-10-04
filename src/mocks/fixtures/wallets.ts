import type { WalletRole, WalletType } from '@/features/wallets/schemas/wallet.schemas'
import type { NetworkId } from '@/features/catalog/schemas/catalog.schemas'

export interface WalletFixture {
  userId: string
  role: WalletRole
  type: WalletType
  network: NetworkId
  address: string
  nickname: string
  ensName: string | null
}

export const walletFixtures: readonly WalletFixture[] = [
  {
    userId: 'usr_nova',
    role: 'primary',
    type: 'metamask',
    network: 'ethereum',
    address: '0xA91F4c27B3d58e61F09a7D2c4E8b13560F9dE82C',
    nickname: 'Principal',
    ensName: null,
  },
  {
    userId: 'usr_nova',
    role: 'secondary',
    type: 'walletconnect',
    network: 'polygon',
    address: '0x3c9E5d0aF7184B62c1D8e9a05F6B7203d4a1C57e',
    nickname: 'Reserva',
    ensName: 'nova.kurio',
  },
  {
    userId: 'usr_rafael',
    role: 'primary',
    type: 'metamask',
    network: 'ethereum',
    address: '0x5d1B8e0F3aC9724b6E1f08D3c7A25b94e60F13a8',
    nickname: 'Principal',
    ensName: null,
  },
]
