import type { WalletDto, WalletRole } from '@/features/wallets/schemas/wallet.schemas'

import { getDb } from '../db/mockDb'
import type { WalletRecord } from '../db/types'

export function walletsOf(userId: string): WalletRecord[] {
  return getDb().wallets[userId] ?? []
}

export function findWallet(userId: string, role: WalletRole): WalletRecord | undefined {
  return walletsOf(userId).find((wallet) => wallet.role === role)
}

/** A secundária "igual à principal" espelha a principal, inclusive depois de uma edição dela. */
export function toWalletDto(wallet: WalletRecord, userId: string): WalletDto {
  const source = wallet.sameAsPrimary ? (findWallet(userId, 'primary') ?? wallet) : wallet

  return {
    id: wallet.id,
    role: wallet.role,
    type: source.type,
    network: source.network,
    address: source.address,
    nickname: source.nickname,
    ens_name: source.ensName,
    same_as_primary: wallet.sameAsPrimary,
  }
}
