import { http } from '@/infrastructure/http/axios'

import { mapWallet } from '../mappers/mapWallet'
import {
  walletDtoSchema,
  walletsResponseSchema,
  type WalletRequest,
  type WalletRole,
} from '../schemas/wallet.schemas'
import type { Wallet } from '../types/wallet'

export const walletKeys = {
  all: ['wallets'] as const,
  list: () => [...walletKeys.all, 'list'] as const,
}

export async function fetchWallets(signal: AbortSignal): Promise<Wallet[]> {
  const { data } = await http.get<unknown>('/wallets', { signal })
  return walletsResponseSchema.parse(data).items.map(mapWallet)
}

export async function saveWallet(role: WalletRole, input: WalletRequest): Promise<Wallet> {
  const { data } = await http.put<unknown>(`/wallets/${role}`, input)
  return mapWallet(walletDtoSchema.parse(data))
}

export async function connectWallet(walletId: string): Promise<void> {
  await http.post(`/wallets/${walletId}/connect`)
}

export async function disconnectWallet(walletId: string): Promise<void> {
  await http.post(`/wallets/${walletId}/disconnect`)
}
