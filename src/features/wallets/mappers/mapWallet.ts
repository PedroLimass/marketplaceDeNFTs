import type { WalletDto } from '../schemas/wallet.schemas'
import type { Wallet } from '../types/wallet'

export function mapWallet(dto: WalletDto): Wallet {
  return {
    id: dto.id,
    role: dto.role,
    type: dto.type,
    network: dto.network,
    address: dto.address,
    nickname: dto.nickname,
    ensName: dto.ens_name,
    sameAsPrimary: dto.same_as_primary,
    connected: dto.connected,
  }
}
